import sys

sys.path.insert(0, "/c/Users/johns/OneDrive/Desktop/projects/rebuild")
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
