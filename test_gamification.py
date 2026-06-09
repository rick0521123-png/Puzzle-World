import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app.api.records import create_record, get_records  # type: ignore
from app.models import ExpenseRecordCreate  # type: ignore

print("Creating first record:")
record1 = ExpenseRecordCreate(amount=100.0, category="food", description="Lunch", is_sdg=False)
res1 = create_record(record1)
print(res1)
print("Has new piece:", res1.new_piece is not None)

print("\nCreating second record on the same day:")
record2 = ExpenseRecordCreate(amount=50.0, category="transport", description="Bus", is_sdg=True)
res2 = create_record(record2)
print(res2)
print("Has new piece:", res2.new_piece is not None)

print("\nFetching all records:")
records = get_records()
for i, rec in enumerate(records):
    print(f"Record {i+1}: {rec.amount} - {rec.category} - {rec.description}")
