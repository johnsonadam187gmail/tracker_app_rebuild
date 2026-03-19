import sys
import os

# Set up paths
root = "C:\\Users\\johns\\OneDrive\\Desktop\\projects\\rebuild"
backend = os.path.join(root, "backend")
sys.path.insert(0, backend)
os.chdir(backend)

# Import and run seed
from seed_complete_data import seed_data

if __name__ == "__main__":
    seed_data()
