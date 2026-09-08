// Mechanical scoping of the approved LAB styles; no parallel design system.
import fs from 'node:fs';
import postcss from 'postcss';
let output='/* Generated from Class 16/17/18 LAB styles. Run node scripts/build-module-styles.mjs. */\n';
for(const [key,file] of [['location','styles-v16.css'],['social','styles-v17.css'],['whatsapp','styles-v18.css']]){
  const css=postcss.parse(fs.readFileSync(file,'utf8'));
  css.walkRules(rule=>{
    rule.selectors=rule.selectors.filter(s=>![':root','html','body'].includes(s.trim())).map(s=>`[data-public-module="${key}"] ${s}`);
    if(!rule.selectors.length)rule.remove();
  });
  output+=css.toString()+'\n';
}
output+=fs.readFileSync('styles-v20-brand.css','utf8');
fs.writeFileSync('styles-v20-public.css',output);
