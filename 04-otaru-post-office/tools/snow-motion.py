import numpy as np
from PIL import Image, ImageFilter
a0=Image.open(r'post-office-src/shots/snow-t8.png').convert('L')
b0=Image.open(r'post-office-src/shots/snow-t9.png').convert('L')
box=(40,40,760,420)
a=np.asarray(a0.crop(box),dtype=np.float32)
b=np.asarray(b0.crop(box),dtype=np.float32)
def hp(img):
    base=np.asarray(Image.fromarray(img.astype(np.uint8)).filter(ImageFilter.GaussianBlur(18)),dtype=np.float32)
    return img-base
ha=hp(a); hb=hp(b)
def score(dy):
    if dy>=0:
        A=ha[:ha.shape[0]-dy]; B=hb[dy:]
    else:
        A=ha[-dy:]; B=hb[:hb.shape[0]+dy]
    return float((A*B).sum()/np.sqrt((A*A).sum()*(B*B).sum()))
vals={dy:score(dy) for dy in range(-25,26)}
best=max(vals,key=vals.get)
print('best vertical screen shift (px):',best,'score',round(vals[best],4))
print(sorted(vals.items(), key=lambda kv:kv[1], reverse=True)[:8])
