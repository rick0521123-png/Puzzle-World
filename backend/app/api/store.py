from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime
import random
from app.models import RedeemRequest, RedeemResponse, PuzzlePiece, StoreItemCreate, StoreItemUpdate, StoreItemResponse
from app.services.reward_service import get_current_season_map
from app.database import (
    get_user_state_from_db, save_user_state_to_db, save_puzzle_piece_to_db,
    get_store_items, get_store_item_by_id, add_store_item, update_store_item, delete_store_item,
    get_user_redemption_count, get_all_user_redemptions, add_user_redemption
)

router = APIRouter()

@router.get("/store/items", response_model=List[StoreItemResponse])
def get_items(account_id: str = "user_1"):
    items = get_store_items()
    redemptions = get_all_user_redemptions(account_id)
    
    response_items = []
    for item in items:
        qty = redemptions.get(item['id'], 0)
        response_items.append(StoreItemResponse(
            id=item['id'],
            name=item['name'],
            cost=item['cost'],
            icon=item['icon'],
            is_piece=bool(item['is_piece']),
            max_limit=item['max_limit'],
            user_redeemed_qty=qty
        ))
    return response_items

@router.post("/store/items", response_model=dict)
def create_item(item: StoreItemCreate):
    item_id = add_store_item(item.dict())
    return {"status": "success", "id": item_id}

@router.put("/store/items/{item_id}", response_model=dict)
def edit_item(item_id: str, item: StoreItemUpdate):
    existing = get_store_item_by_id(item_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    update_store_item(item_id, item.dict())
    return {"status": "success"}

@router.delete("/store/items/{item_id}", response_model=dict)
def delete_item(item_id: str):
    existing = get_store_item_by_id(item_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    delete_store_item(item_id)
    return {"status": "success"}

@router.post("/store/redeem", response_model=RedeemResponse)
def redeem_item(request: RedeemRequest, account_id: str = "user_1"):
    user_state = get_user_state_from_db(account_id)
        
    item = get_store_item_by_id(request.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="商品不存在")
        
    # Check limit
    if item['max_limit'] > 0:
        redeemed_qty = get_user_redemption_count(account_id, request.item_id)
        if redeemed_qty + request.quantity > item['max_limit']:
            raise HTTPException(status_code=400, detail="超過兌換上限")
            
    total_cost = item['cost'] * request.quantity
    
    if user_state.points < total_cost:
        raise HTTPException(status_code=400, detail="點數不足")
        
    user_state.points -= total_cost
    
    new_pieces = []
    if item['is_piece']:
        today_ym = datetime.now().strftime("%Y-%m")
        acquired_ids = [p.piece_id for p in user_state.unlocked_pieces if p.acquired_at.strftime("%Y-%m") == today_ym]
        available_ids = [i for i in range(36) if i not in acquired_ids]
        
        # Ensure we don't try to buy more pieces than available
        quantity_to_buy = min(request.quantity, len(available_ids))
        
        if quantity_to_buy > 0:
            for _ in range(quantity_to_buy):
                piece_id = random.choice(available_ids)
                available_ids.remove(piece_id)
                map_id = get_current_season_map()
                piece = PuzzlePiece(
                    piece_id=piece_id,
                    map_id=map_id,
                    category="store",
                    is_shiny=True,
                    acquired_at=datetime.now()
                )
                user_state.redeemed_pieces.append(piece)
                user_state.unlocked_pieces.append(piece)
                new_pieces.append(piece)
                save_puzzle_piece_to_db(account_id, piece)
            
            # If user wanted to buy more than available, refund the difference
            if quantity_to_buy < request.quantity:
                refund = (request.quantity - quantity_to_buy) * item['cost']
                user_state.points += refund
                
            # Add to user redemptions (only what was successfully bought)
            add_user_redemption(account_id, request.item_id, quantity_to_buy)
            message = f"兌換成功！解鎖了 {quantity_to_buy} 塊拼圖！"
        else:
            user_state.points += total_cost
            raise HTTPException(status_code=400, detail="本月份拼圖已經集滿囉！")
    else:
        add_user_redemption(account_id, request.item_id, request.quantity)
        message = f"兌換成功！已扣除 {total_cost} 點數。"
        
    save_user_state_to_db(user_state)
        
    return RedeemResponse(
        status="success",
        message=message,
        remaining_points=user_state.points,
        new_pieces=new_pieces
    )
