
from dotenv import load_dotenv
import os
load_dotenv()

from data_loader import load_data
import logging


logging.basicConfig(level=logging.INFO)
try:
    load_data()
    print("Data loaded successfully!")
except Exception as e:
    print(f"Error loading data: {e}")
