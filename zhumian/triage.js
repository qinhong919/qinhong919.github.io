const app=document.querySelector("#app"),progress=document.querySelector("#progress"),KEY="zhumian.triage.v101";
function homeGate(){if(state.result&&(state.nights||[]).length>=7){showVerdict();return true}return false}
