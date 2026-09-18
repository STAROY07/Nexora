import sys
import os

root_dir = os.path.abspath(os.path.dirname(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app import app

if __name__ == '__main__':
    from backend.config import Config
    from backend.database import init_db
    init_db()
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
