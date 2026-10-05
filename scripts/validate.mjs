import {load,assertValid} from './core.mjs';
try {if(!process.argv[2])throw new Error('用法：node scripts/validate.mjs report.json');const {data,base}=load(process.argv[2]);assertValid(data,base);console.log('Report structure, references and review records passed.');}catch(e){console.error(e.message);process.exitCode=1;}
