/* Minimal static server shared by the browser tests (no external dependency). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};

export function startServer(port=4173){
  const base=process.env.MOBILE_BASELINE_SHA;
  if(base&&!/^[a-f0-9]{40}$/.test(base))throw new Error('MOBILE_BASELINE_SHA must be an exact commit SHA');
  const cache=new Map();
  const read=(file,rel,done)=>{
    if(!base)return fs.readFile(file,done);
    if(cache.has(rel))return done(null,cache.get(rel));
    execFile('git',['show',`${base}:${rel}`],{cwd:ROOT,encoding:null,maxBuffer:64*1024*1024},(error,buf)=>{
      if(!error)cache.set(rel,buf);done(error,buf);
    });
  };
  const server=http.createServer((req,res)=>{
    const url=decodeURIComponent((req.url||'/').split('?')[0]);
    const rel=url==='/'?'index.html':url.replace(/^\/+/,'');
    const file=path.join(ROOT,rel);
    if(!file.startsWith(ROOT)){res.writeHead(403).end();return}
    read(file,rel,(err,buf)=>{
      if(err){res.writeHead(404,{'content-type':'text/plain'}).end('not found');return}
      res.writeHead(200,{'content-type':TYPES[path.extname(file).toLowerCase()]||'application/octet-stream'});
      res.end(buf);
    });
  });
  /* port 0 asks the OS for a free port, so a stale server never blocks a run. */
  return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>{const p=server.address().port;resolve({server,port:p,url:`http://127.0.0.1:${p}`})}));
}
