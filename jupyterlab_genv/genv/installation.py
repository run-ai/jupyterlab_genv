import os

def root() -> str:
  if 'GENV_ROOT' in os.environ:
    return os.environ['GENV_ROOT']

  return os.path.join(os.environ['HOME'], 'genv');
