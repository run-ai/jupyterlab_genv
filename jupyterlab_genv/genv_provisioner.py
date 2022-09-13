import jupyter_client
import os
import random
from typing import Any, Dict

NUM_OF_GPUS = 8

class GenvProvisioner(jupyter_client.LocalProvisioner):
    async def pre_launch(self, **kwargs: Any) -> Dict[str, Any]:
        indices = random.choices(range(NUM_OF_GPUS), k=random.randint(1, NUM_OF_GPUS - 1))

        env = kwargs.pop('env', os.environ).copy()
        env.update({ 'CUDA_VISIBLE_DEVICES': ','.join(str(index) for index in indices) })
        kwargs['env'] = env
        return await super().pre_launch(**kwargs)
