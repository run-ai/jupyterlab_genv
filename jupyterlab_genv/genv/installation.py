import os

def root() -> str:
  return os.path.join(os.environ['HOME'], 'genv');
