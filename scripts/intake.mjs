import {load,intake} from './core.mjs';
try {if(!process.argv[2])throw new Error('用法：node scripts/intake.mjs intake.json');const {data,base}=load(process.argv[2]);const e=intake(data,base);if(e.length)throw new Error(e.join('\n'));console.log('Input gate passed.');}catch(e){console.error(e.message);process.exitCode=1;}
