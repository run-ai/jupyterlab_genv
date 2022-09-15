import jupyter_client
import os
from typing import Any, Dict, List, Union

NUM_OF_GPUS = 8

indices = None

def set_indices(value: Union[List[int], None]) -> None:
    global indices
    indices = value

class GenvProvisioner(jupyter_client.LocalProvisioner):
    async def pre_launch(self, **kwargs: Any) -> Dict[str, Any]:
        if indices is not None:
            env = kwargs.pop('env', os.environ).copy()
            env.update({ 'CUDA_VISIBLE_DEVICES': ','.join(str(index) for index in indices) })
            kwargs['env'] = env

        return await super().pre_launch(**kwargs)
