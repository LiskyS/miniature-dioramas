import numpy as np
from PIL import Image
A=np.asarray(Image.open(r'post-office-src/shots/snowonly-t8.png').convert('L'),dtype=np.float32)
B=np.asarray(Image.open(r'post-office-src/shots/snowonly-t9.png').convert('L'),dtype=np.float32)
# crop out vignette edges / any weird strip
A=A[80:720,120:1080]; B=B[80:720,120:1080]
# suppress tiny sensor-ish grain and keep flakes
A[A<18]=0; B[B<18]=0
def corr(dy,dx):
    if dy>=0: ar=slice(0,A.shape[0]-dy); br=slice(dy,A.shape[0])
    else: ar=slice(-dy,A.shape[0]); br=slice(0,A.shape[0]+dy)
    if dx>=0: ac=slice(0,A.shape[1]-dx); bc=slice(dx,A.shape[1])
    else: ac=slice(-dx,A.shape[1]); bc=slice(0,A.shape[1]+dx)
    a=A[ar,ac]; b=B[br,bc]
    den=np.sqrt((a*a).sum()*(b*b).sum())
    return float((a*b).sum()/den) if den>0 else 0
vals=[]
for dy in range(-24,25):
    best=max(corr(dy,dx) for dx in range(-8,9))
    vals.append((dy,best))
vals.sort(key=lambda x:-x[1])
print(vals[:10])
# best dx for the best dy
dy=vals[0][0]
xbest=max(((dx,corr(dy,dx)) for dx in range(-12,13)), key=lambda kv:kv[1])
print('best dy,dx:',dy,xbest)
