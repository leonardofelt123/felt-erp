import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";

// ─── FIREBASE ───
const app = initializeApp({
  apiKey: "AIzaSyC76ZJql9z4l7-7-Mgwsuy-E1z6cbME6Jc",
  authDomain: "felt-erp-2.firebaseapp.com",
  databaseURL: "https://felt-erp-2-default-rtdb.firebaseio.com",
  projectId: "felt-erp-2",
  storageBucket: "felt-erp-2.firebasestorage.app",
  messagingSenderId: "1031050968667",
  appId: "1:1031050968667:web:9158c90614ed62ac8a497e"
});
const fdb = getDatabase(app);

// ─── CONSTANTS ───
const CC_OBRA_DEFAULT = ["MATERIAL","ADMINISTRATIVO","MÃO DE OBRA","SERVIÇOS TERCEIROS","TRANSPORTE/FRETES","IMPOSTO","RT","MARCENARIA","VIDRAÇARIA","SERRALHERIA","PINTURA","ELÉTRICA","HIDRÁULICA","IMPERMEABILIZAÇÃO"];
const CC_FUNC = ["TIAGO","STEFANI","RAFAEL","FELIPE","ALLEF","MATEUS"];
const CC_ADM = ["CONTABILIDADE","ASSINATURAS","RDO","GARAGEM","INTERNET/TELEFONE","ALIMENTAÇÃO","TRÁFEGO PAGO","TERCEIROS","COMPRAS"];
const CC_OPER = ["COMBUSTÍVEL","PEDÁGIO","CAFÉ DA MANHÃ","ALIMENTAÇÃO EQUIPE","ESTACIONAMENTO","UBER/TRANSPORTE","OUTROS"];
const FUNCOES = ["PEDREIRO","AJUDANTE","ELETRICISTA","ENCANADOR","GESSEIRO","CERAMISTA","PINTOR","SERRALHEIRO","MARCENEIRO","TÉCNICO AR","SERVENTE","MESTRE DE OBRAS","OUTRO"];
const STATUS_OPTS = ["Em andamento","Concluída","Parada","Orçamento"];
const FAT_STATUS = ["RECEBIDO","A VENCER","PROXIMO","VENCIDO"];
const FAT_STATUS_COLOR = {RECEBIDO:"#34d399","A VENCER":"#22d3ee",PROXIMO:"#fbbf24",VENCIDO:"#f87171"};
// Obra-Cliente matching para cross-reference entre custos e faturamento
const OBRA_CLIENTE_MAP = {
  "o1":["HL 227"],
  "o2":["LIVING DUETT","DUETT"],
  "o3":["EPICO 154","ANALICE"],
  "o4":["NAU KLABIN APT 1607","NAU 1607"],
  "o5":["LANDMARK APT 202","LANDMARK"]
};
// Token → Cliente map para portal
const PORTAL_TOKENS = {
  "parkview-tanii": "PARK VIEW - FERNANDO TANII",
  "epico-edson": "EPICO 263 EDSON",
  "nau-klabin": "NAU KLABIN APT 1607",
  "landmark-cleito": "LANDMARK 138 CLEITO",
  "landmark-202": "LANDMARK APT 202",
  "duett-mooca": "LIVING DUETT - MOOCA",
  "epico-analice": "EPICO 154 - ANALICE",
  "hl-227": "HL 227"
};
const USERS = [
  { username:"leonardo", password:"felt2026", role:"admin", nome:"Leonardo Felt", avatar:"LF" },
  { username:"salles", password:"salles2026", role:"admin", nome:"Salles Paulo", avatar:"SP" },
  { username:"tiago", password:"tiago123", role:"viewer", nome:"Tiago Engenheiro", avatar:"TE" },
  { username:"rafael", password:"felt2026", role:"diarista", nome:"Rafael", avatar:"RF" }
];

// ─── SEED ───
// IMPORTANTE: o ID interno do seed é usado como chave do Firebase (set em chave = id).
// Isso elimina a divergência entre cob.id ("cb1") e fbKey (uid aleatório).
const buildSeed = () => {
  const obras = {
    o1:{id:"o1",nome:"OBRA HL 227",contrato:120000,aliquota:0,rt:0,status:"Em andamento"},
    o2:{id:"o2",nome:"OBRA DUETT 126",contrato:81000,aliquota:0,rt:0,status:"Em andamento"},
    o3:{id:"o3",nome:"OBRA ÉPICO 154",contrato:140000,aliquota:0,rt:0,status:"Em andamento"},
    o4:{id:"o4",nome:"OBRA NAU 1607",contrato:132000,aliquota:0.07,rt:0.04773,status:"Em andamento"},
    o5:{id:"o5",nome:"OBRA LANDMARK",contrato:148000,aliquota:0,rt:0.05,status:"Em andamento"}
  };
  const L = {}; let n = 1;
  const a = (oid,d,v,dt,cc,ob="",t="obra") => {
    const id = "s" + (n++);
    L[id] = {id,obraId:oid||"",descricao:d,valor:v,data:dt,centroCusto:cc,obs:ob,tipo:t};
  };
  // HL 227
  a("o1","MÃO DE OBRA CIVIL - NOEL",45000,"2026-01-05","MÃO DE OBRA","NOEL");
  a("o1","EMISSÃO DE ART",271.47,"2026-01-05","ADMINISTRATIVO","ART");
  a("o1","MATERIAL AR CONDICIONADO",559.48,"2026-01-14","MATERIAL");
  a("o1","MATERIAL FORRO DE GESSO",1967.49,"2026-01-19","MATERIAL");
  a("o1","ARGAMASSA E AGREGADOS",1380,"2026-01-19","MATERIAL");
  a("o1","MATERIAL HIDRÁULICA",38.63,"2026-01-26","MATERIAL");
  a("o1","COMPLEMENTO DRYWALL",1194.01,"2026-02-05","MATERIAL");
  a("o1","AGREGADOS",142.74,"2026-02-19","MATERIAL");
  a("o1","MATERIAL HIDRÁULICA",115.40,"2026-02-23","MATERIAL");
  a("o1","AGREGADOS CIMEMPRIMO",827,"2026-02-24","MATERIAL");
  a("o1","MATERIAIS ELÉTRICOS PEREZ",1600,"2026-02-24","MATERIAL");
  a("o1","EPI",496.03,"2026-02-24","ADMINISTRATIVO");
  a("o1","FITA CREPE",125,"2026-02-24","MATERIAL");
  a("o1","MATERIAIS INSTALAÇÃO DE PISO",300,"2026-02-24","MATERIAL");
  // DUETT
  a("o2","MÃO DE OBRA CIVIL - NOEL",43000,"2026-02-19","MÃO DE OBRA");
  a("o2","PAPELÃO ONDULADO",1091.25,"2026-02-19","MATERIAL");
  a("o2","EMISSÃO DE ART",271.47,"2026-02-19","ADMINISTRATIVO");
  a("o2","FITA CREPE",254.05,"2026-02-19","MATERIAL");
  a("o2","MATERIAL LIMPEZA",47,"2026-02-19","MATERIAL");
  a("o2","ARGAMASSA - CIMEMPRIMO",1089,"2026-02-24","MATERIAL");
  a("o2","MATERIAIS ELÉTRICOS PEREZ",1600,"2026-02-24","MATERIAL");
  a("o2","MATERIAIS INSTALAÇÃO DE PISO",300,"2026-02-24","MATERIAL");
  a("o2","MATERIAL DRYWALL",3398,"2026-03-04","MATERIAL");
  a("o2","FRETE DESCARGA DRYWALL",250,"2026-03-05","TRANSPORTE/FRETES");
  // ÉPICO 154
  a("o3","MÃO DE OBRA CIVIL - NOEL",47000,"2026-02-19","MÃO DE OBRA");
  a("o3","PAPELÃO ONDULADO",1091.25,"2026-02-19","MATERIAL");
  a("o3","EMISSÃO DE ART",271.47,"2026-02-15","ADMINISTRATIVO");
  a("o3","MATERIAL DRYWALL",1800,"2026-02-18","MATERIAL");
  a("o3","MATERIAL AR-CONDICIONADO",3625.17,"2026-02-20","MATERIAL");
  a("o3","AGREGADOS CIMEMPRIMO",1380,"2026-02-24","MATERIAL");
  a("o3","MATERIAIS ELÉTRICOS PEREZ",1600,"2026-02-24","MATERIAL");
  a("o3","SACOS DE ENTULHO",228,"2026-02-24","MATERIAL");
  a("o3","FITA CREPE",125,"2026-02-24","MATERIAL");
  a("o3","MATERIAIS INSTALAÇÃO DE PISO",300,"2026-02-24","MATERIAL");
  a("o3","MARMITEIRO",309,"2026-02-25","ADMINISTRATIVO");
  a("o3","MATERIAIS AGREGADOS",878.59,"2026-03-03","MATERIAL");
  a("o3","DESCARGA MATERIAL OBRAMAX",250,"2026-03-04","TRANSPORTE/FRETES");
  // NAU
  a("o4","MÃO DE OBRA CIVIL - NOEL",56000,"2026-03-03","MÃO DE OBRA");
  a("o4","PAPELÃO ONDULADO",1091.25,"2026-02-19","MATERIAL");
  a("o4","EMISSÃO DE ART",285.59,"2026-03-03","ADMINISTRATIVO");
  a("o4","EMISSÃO DE NF (IMPOSTO)",2590,"2026-03-03","IMPOSTO");
  a("o4","PAGAMENTO RT - ORAZI",6300,"2026-03-03","RT");
  a("o4","MATERIAL DRYWALL",3961,"2026-03-04","MATERIAL");
  a("o4","FRETE DESCARGA DRYWALL",250,"2026-03-05","TRANSPORTE/FRETES");
  // LANDMARK
  a("o5","PAPELÃO ONDULADO",1091.25,"2026-02-19","MATERIAL");
  // Funcionários (mensalistas - pagamentos históricos)
  a("","TIAGO ENGENHEIRO",2250,"2026-01-15","TIAGO","","funcionario");
  a("","STEFANI",750,"2026-01-15","STEFANI","","funcionario");
  a("","FELIPE ESTAGIÁRIO",1000,"2026-01-15","FELIPE","","funcionario");
  a("","TIAGO ENGENHEIRO",2250,"2026-01-30","TIAGO","","funcionario");
  a("","STEFANI",750,"2026-01-30","STEFANI","","funcionario");
  a("","ALLEF AJUDANTE",2000,"2026-01-30","ALLEF","","funcionario");
  a("","TIAGO ENGENHEIRO",2000,"2026-02-04","TIAGO","","funcionario");
  a("","STEFANI",600,"2026-01-30","STEFANI","","funcionario");
  a("","ALLEF AJUDANTE",1000,"2026-02-13","ALLEF","","funcionario");
  a("","TIAGO ENGENHEIRO",1750,"2026-02-13","TIAGO","","funcionario");
  a("","STEFANI",750,"2026-02-13","STEFANI","","funcionario");
  a("","FELIPE ESTAGIÁRIO",1250,"2026-02-13","FELIPE","","funcionario");
  a("","TIAGO ENGENHEIRO",1750,"2026-02-27","TIAGO","","funcionario");
  a("","STEFANI",1000,"2026-02-27","STEFANI","","funcionario");
  a("","FELIPE ESTAGIÁRIO",1250,"2026-02-27","FELIPE","","funcionario");
  // Administrativo
  a("","CONTABILIDADE - JAN",405,"2026-01-01","CONTABILIDADE","","administrativo");
  a("","DIÁRIO DE OBRA - JAN",160,"2026-01-01","RDO","","administrativo");
  a("","ASSINATURAS - JAN",174.80,"2026-01-01","ASSINATURAS","CANVA,CAPCUT,D4SIGN,META","administrativo");
  a("","GARAGEM - JAN",300,"2026-01-01","GARAGEM","","administrativo");
  a("","FATURAS CLARO - JAN",854.48,"2026-01-01","INTERNET/TELEFONE","","administrativo");
  a("","ALIMENTAÇÃO - JAN",1461.38,"2026-01-01","ALIMENTAÇÃO","","administrativo");
  a("","VÍDEO MOEMA TRÁFEGO",110,"2026-01-06","TRÁFEGO PAGO","","administrativo");
  a("","JOBHUNTER CONTRATAÇÃO",2400,"2026-01-10","TERCEIROS","","administrativo");
  a("","CONTABILIDADE - FEV",405,"2026-02-01","CONTABILIDADE","","administrativo");
  a("","DIÁRIO DE OBRA - FEV",160,"2026-02-01","RDO","","administrativo");
  a("","ASSINATURAS - FEV",174.80,"2026-02-01","ASSINATURAS","","administrativo");
  a("","GARAGEM - FEV",300,"2026-02-01","GARAGEM","","administrativo");
  a("","FATURAS CLARO - FEV",416.56,"2026-02-01","INTERNET/TELEFONE","","administrativo");
  a("","ALIMENTAÇÃO - FEV",1227.01,"2026-02-01","ALIMENTAÇÃO","","administrativo");
  a("","COMPRA IPHONE 13",1000,"2026-02-01","COMPRAS","","administrativo");
  a("","CONTABILIDADE - MAR",405,"2026-03-01","CONTABILIDADE","","administrativo");
  a("","DIÁRIO DE OBRA - MAR",160,"2026-03-01","RDO","","administrativo");
  a("","ASSINATURAS - MAR",174.80,"2026-03-01","ASSINATURAS","","administrativo");
  a("","GARAGEM - MAR",300,"2026-03-01","GARAGEM","","administrativo");
  a("","TRÁFEGO PAGO GOOGLE MAR",1500,"2026-03-01","TRÁFEGO PAGO","","administrativo");
  a("","TABLET SAMSUNG",2904,"2026-03-03","COMPRAS","","administrativo");

  // ─── CLIENTES (portfolio completo) ───
  const clientes = {};
  let cn = 1;
  const cl = (nome,ano,contrato,pago,status,token=null) => {
    const id = "cl" + (cn++);
    clientes[id] = {id,nome,ano,contrato,pagoPre:pago,status,portalToken:token};
  };
  cl("JOAO DE LUCA",2024,11000,11000,"QUITADO");cl("PERDIZES 61B",2024,250000,250000,"QUITADO");cl("FRUTARIA",2024,115000,115000,"QUITADO");cl("OBRA MATHEUS",2024,55000,55000,"QUITADO");
  cl("OBRA LUIZ",2025,55000,55000,"QUITADO");cl("OBRA ESTRUTURA",2025,32000,32000,"QUITADO");cl("ADITIVO PERDIZES",2025,15000,0,"EM ANDAMENTO");cl("CONNECT 1",2025,83000,66400,"EM ATRASO");
  cl("HL 156",2025,45000,45000,"QUITADO");cl("HL 143",2025,51000,51000,"QUITADO");cl("HL 173",2025,62000,62000,"QUITADO");cl("HL 144",2025,30000,30000,"QUITADO");
  cl("HL 106",2025,55000,55000,"QUITADO");cl("HL 132",2025,52000,38500,"QUITADO");cl("HL 224",2025,65000,58925,"QUITADO");cl("HL 223",2025,61000,60000,"QUITADO");
  cl("HL 177",2025,90000,78750,"EM ANDAMENTO");cl("CONNECT 2",2025,75000,75000,"QUITADO");cl("CONNECT 3",2025,70000,70000,"QUITADO");cl("HL 216",2025,65000,55250,"EM ANDAMENTO");
  cl("HL 141",2025,3500,3500,"QUITADO");cl("NAU",2025,82000,73710,"EM ANDAMENTO");cl("ADITIVO HL 143",2025,800,800,"QUITADO");cl("EPICO 54 MAIARA",2025,70000,50000,"EM ANDAMENTO");
  cl("EPICO 81 CAIQUE",2025,140000,80000,"EM ANDAMENTO");cl("VIVAZ CLARISSE",2025,43000,32000,"QUITADO");cl("HL 218",2025,58700,47700,"EM ANDAMENTO");cl("HL 148",2025,116000,110200,"EM ANDAMENTO");
  cl("BY YOO - MOEMA",2025,307000,224000,"EM ANDAMENTO");cl("HL 166",2025,63000,48910,"EM ANDAMENTO");cl("HL 58",2025,80000,57500,"EM ANDAMENTO");cl("ADITIVO HL 132",2025,700,700,"QUITADO");
  cl("HL 164",2025,61000,43000,"EM ATRASO");cl("HL 211",2025,60000,53925,"EM ANDAMENTO");
  cl("HL 227",2026,120260,0,"EM ANDAMENTO","hl-227");
  cl("LIVING DUETT - MOOCA",2026,81000,0,"EM ANDAMENTO","duett-mooca");
  cl("LANDMARK APT 202",2026,148000,35000,"EM ANDAMENTO","landmark-202");
  cl("EPICO 154 - ANALICE",2026,140000,0,"EM ANDAMENTO","epico-analice");
  cl("NAU KLABIN APT 1607",2026,132000,0,"EM ANDAMENTO","nau-klabin");
  cl("PROJETO CHINES",2026,20000,6000,"EM ANDAMENTO");
  cl("EPICO 263 EDSON",2026,370000,0,"EM ANDAMENTO","epico-edson");
  cl("LANDMARK 138 CLEITO",2026,134000,0,"EM ANDAMENTO","landmark-cleito");
  cl("PARK VIEW - FERNANDO TANII",2026,420000,0,"EM ANDAMENTO","parkview-tanii");

  // ─── COBRANÇAS ───
  // CORREÇÃO CRÍTICA: chave do Firebase === id interno. Elimina a divergência cb1 ≠ fbKey.
  const cobrancas = {};
  let cb = 1;
  const co = (data,cliente,valor,status,obs="") => {
    const id = "cb" + (cb++);
    cobrancas[id] = {id,data,cliente,valor,status,obs};
  };
  // Janeiro
  co("2026-01-05","HL 164",6000,"RECEBIDO","1a parcela");co("2026-01-05","HL 227",27625,"RECEBIDO","2a parcela");co("2026-01-09","HL 224",6075,"RECEBIDO","Última parcela");
  co("2026-01-15","HL 132",13500,"RECEBIDO","Última parcela");co("2026-01-15","HL 58",7500,"RECEBIDO","Parcela Jan");co("2026-01-21","VIVAZ CLARISSE",11000,"RECEBIDO","Parcela Jan");
  co("2026-01-23","EPICO 81 CAIQUE",20000,"RECEBIDO","Parcela Jan");co("2026-01-26","HL 227",13812.5,"RECEBIDO","3a parcela");co("2026-01-29","HL 164",6000,"RECEBIDO","2a parcela");
  co("2026-01-30","HL 58",7500,"RECEBIDO","Parcela Jan");
  // Fevereiro
  co("2026-02-09","HL 227",13812.5,"RECEBIDO","4a parcela");co("2026-02-23","HL 227",13812.5,"RECEBIDO","5a parcela");co("2026-02-23","LIVING DUETT - MOOCA",22000,"RECEBIDO","Entrada");
  co("2026-02-23","EPICO 154 - ANALICE",27500,"RECEBIDO","Entrada");
  // Março
  co("2026-03-02","LANDMARK APT 202",35000,"RECEBIDO","1a parcela");co("2026-03-02","NAU KLABIN APT 1607",37000,"RECEBIDO","Entrada");co("2026-03-09","HL 227",13812.5,"RECEBIDO","6a parcela");
  co("2026-03-10","EPICO 154 - ANALICE",10312.5,"RECEBIDO","2a parcela");co("2026-03-20","LIVING DUETT - MOOCA",15000,"RECEBIDO","2a parcela");co("2026-03-20","HL 177",11250,"PROXIMO","Medição adicional");
  co("2026-03-20","HL 148",5800,"PROXIMO","Saldo medição anterior");co("2026-03-23","HL 227",13812.5,"RECEBIDO","7a parcela");co("2026-03-27","EPICO 154 - ANALICE",10312.5,"RECEBIDO","3a parcela");
  co("2026-03-27","NAU",8290,"PROXIMO","Última parcela");co("2026-03-27","HL 218",11000,"PROXIMO","Última parcela");co("2026-03-27","HL 216",9750,"PROXIMO","Última parcela");
  co("2026-03-27","EPICO 263 EDSON",48000,"RECEBIDO","1a parcela");co("2026-03-30","HL 211",6075,"PROXIMO","Saldo final");co("2026-03-31","HL 58",7500,"PROXIMO","Saldo restante");
  co("2026-03-31","HL 164",6000,"VENCIDO","COBRAR — saldo vencido");co("2026-03-31","HL 166",14090,"VENCIDO","COBRAR — saldo vencido");co("2026-03-31","CONNECT 1",16600,"VENCIDO","COBRAR — sem data");
  co("2026-03-31","ADITIVO PERDIZES",15000,"VENCIDO","COBRAR — definir data");
  // Abril
  co("2026-04-01","BY YOO - MOEMA",83000,"A VENCER","Saldo final");co("2026-04-02","NAU KLABIN APT 1607",22500,"RECEBIDO","2a medição");co("2026-04-02","PARK VIEW - FERNANDO TANII",84000,"A VENCER","1a medição — 20%");
  co("2026-04-06","HL 227",13812.5,"A VENCER","8a parcela — última");co("2026-04-06","LANDMARK APT 202",20000,"A VENCER","2a parcela");co("2026-04-10","LANDMARK 138 CLEITO",26800,"A VENCER","1a parcela");
  co("2026-04-17","EPICO 263 EDSON",48000,"A VENCER","2a parcela");co("2026-04-20","EPICO 54 MAIARA",20000,"A VENCER","Parcela Abr");co("2026-04-20","LIVING DUETT - MOOCA",15000,"A VENCER","3a parcela");
  co("2026-04-27","EPICO 154 - ANALICE",15000,"A VENCER","4a parcela");co("2026-04-27","LANDMARK APT 202",20000,"A VENCER","3a parcela");co("2026-04-30","EPICO 81 CAIQUE",40000,"A VENCER","Saldo final");
  // Maio
  co("2026-05-01","HL 227",9760,"A VENCER","Nova medição — aditivo");co("2026-05-03","NAU KLABIN APT 1607",22500,"A VENCER","3a medição");co("2026-05-07","EPICO 263 EDSON",35000,"A VENCER","3a parcela");
  co("2026-05-10","LANDMARK 138 CLEITO",10000,"A VENCER","2a parcela");co("2026-05-15","ADITIVO PERDIZES",15000,"A VENCER","Parcela Mai");co("2026-05-18","LANDMARK APT 202",20000,"A VENCER","4a parcela");
  co("2026-05-22","LIVING DUETT - MOOCA",13000,"A VENCER","4a parcela");co("2026-05-27","EPICO 154 - ANALICE",15000,"A VENCER","5a parcela");co("2026-05-30","EPICO 263 EDSON",35000,"A VENCER","4a parcela");
  // Junho
  co("2026-06-01","PARK VIEW - FERNANDO TANII",50000,"A VENCER","2a medição — 11,90%");co("2026-06-05","HL 148",16000,"A VENCER","Saldo final");co("2026-06-05","LANDMARK APT 202",20000,"A VENCER","5a parcela");
  co("2026-06-10","LANDMARK 138 CLEITO",15000,"A VENCER","3a parcela");co("2026-06-19","EPICO 263 EDSON",48000,"A VENCER","5a parcela");co("2026-06-22","LIVING DUETT - MOOCA",10000,"A VENCER","5a parcela");
  co("2026-06-26","LANDMARK APT 202",20000,"A VENCER","6a parcela");co("2026-06-27","EPICO 154 - ANALICE",15000,"A VENCER","6a parcela");
  // Julho
  co("2026-07-01","PARK VIEW - FERNANDO TANII",65000,"A VENCER","3a medição — 15,48%");co("2026-07-02","NAU KLABIN APT 1607",27500,"A VENCER","4a medição — SALDO FINAL");
  co("2026-07-06","LIVING DUETT - MOOCA",6000,"A VENCER","6a parcela — SALDO FINAL");co("2026-07-09","EPICO 263 EDSON",40000,"A VENCER","6a parcela");
  co("2026-07-10","LANDMARK 138 CLEITO",15000,"A VENCER","4a parcela");co("2026-07-20","LANDMARK APT 202",13000,"A VENCER","7a parcela — SALDO FINAL");
  co("2026-07-27","EPICO 154 - ANALICE",15000,"A VENCER","7a parcela");co("2026-07-31","EPICO 263 EDSON",35000,"A VENCER","7a parcela");
  // Agosto
  co("2026-08-01","PARK VIEW - FERNANDO TANII",85000,"A VENCER","4a medição — 20,24%");co("2026-08-10","LANDMARK 138 CLEITO",15000,"A VENCER","5a parcela");
  co("2026-08-14","EPICO 263 EDSON",25000,"A VENCER","8a parcela");co("2026-08-27","EPICO 154 - ANALICE",15000,"A VENCER","8a parcela");co("2026-08-28","EPICO 263 EDSON",25000,"A VENCER","9a parcela");
  // Setembro
  co("2026-09-01","PARK VIEW - FERNANDO TANII",85000,"A VENCER","5a medição — 20,24%");co("2026-09-10","LANDMARK 138 CLEITO",15000,"A VENCER","6a parcela");
  co("2026-09-11","EPICO 263 EDSON",15500,"A VENCER","10a parcela");co("2026-09-27","EPICO 154 - ANALICE",16875,"A VENCER","9a parcela — SALDO FINAL");
  // Outubro
  co("2026-10-01","PARK VIEW - FERNANDO TANII",36000,"A VENCER","6a medição — 8,57%");co("2026-10-10","LANDMARK 138 CLEITO",13000,"A VENCER","7a parcela");
  // Novembro
  co("2026-11-10","LANDMARK 138 CLEITO",13000,"A VENCER","8a parcela");co("2026-11-11","LANDMARK 138 CLEITO",11200,"A VENCER","9a parcela — SALDO FINAL");
  co("2026-11-15","PARK VIEW - FERNANDO TANII",15000,"A VENCER","8a medição — SALDO FINAL");

  // NFs
  const nfs = {};
  let nfn = 1;
  const nf = (data,cliente,valor) => {
    const id = "nf" + (nfn++);
    nfs[id] = {id,data,cliente,valor};
  };
  nf("2024-07-01","JOAO DE LUCA",11500);nf("2025-01-07","MANSUR",4000);nf("2025-02-14","FRUTARIA IPIRANGA",30000);nf("2025-02-19","PERDIZES 61B",20000);
  nf("2025-03-11","OBRA ESTRUTURA",31972);nf("2025-03-18","PERDIZES 61B",20000);nf("2025-05-12","PERDIZES 61B",20000);nf("2025-08-13","HL 144",30000);
  nf("2025-09-04","HL 177",27000);nf("2025-10-27","HL 106",55250);nf("2025-11-13","HL 164",20000);nf("2025-11-13","HL 177",50000);
  nf("2026-01-08","VIVAZ CLARISSE",43000);nf("2026-02-26","NAU KLABIN 1607",37000);nf("2026-04-07","NAU KLABIN 1607",22500);

  // Equipe
  const equipe = {};
  let en = 1;
  const eq = (nome,funcao,tipo,valorDiaria,salario=0) => {
    const id = "eq" + (en++);
    equipe[id] = {id,nome,funcao,tipo,valorDiaria:valorDiaria||0,salario:salario||0,ativo:true};
  };
  eq("TIAGO","ENGENHEIRO","mensalista",0,4500);eq("STEFANI","ADMINISTRATIVO","mensalista",0,2000);eq("RAFAEL","ENGENHEIRO","mensalista",0,3500);eq("NOEL","MESTRE DE OBRAS","mensalista",0,5000);
  eq("ALLEF","AJUDANTE","diarista",150);eq("CARLOS","PEDREIRO","diarista",250);eq("JONAS","PEDREIRO","diarista",250);eq("WELLINGTON","AJUDANTE","diarista",150);
  eq("RENAN","ELETRICISTA","diarista",300);eq("DIEGO","ENCANADOR","diarista",280);eq("MARCOS","SERVENTE","diarista",130);eq("LUCAS","AJUDANTE","diarista",150);

  // Diárias
  const diarias = {};
  let dn = 1;
  const di = (eqId,obraId,data) => {
    const id = "di" + (dn++);
    diarias[id] = {id,equipeId:eqId,obraId,data};
  };
  di("eq5","o1","2026-03-03");di("eq5","o1","2026-03-04");di("eq5","o1","2026-03-05");di("eq5","o4","2026-03-06");di("eq5","o4","2026-03-07");
  di("eq6","o4","2026-03-03");di("eq6","o4","2026-03-04");di("eq6","o4","2026-03-05");di("eq6","o4","2026-03-06");di("eq6","o3","2026-03-07");
  di("eq7","o3","2026-03-03");di("eq7","o3","2026-03-04");di("eq7","o1","2026-03-05");di("eq7","o1","2026-03-06");di("eq7","o1","2026-03-07");
  di("eq8","o1","2026-03-03");di("eq8","o4","2026-03-04");di("eq8","o4","2026-03-05");di("eq8","o3","2026-03-06");di("eq8","o3","2026-03-07");

  return { obras, lancamentos:L, clientes, cobrancas, nfs, equipe, diarias };
};

// ─── UTILS ───
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const R$ = v => (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const pct = v => ((v||0)*100).toFixed(1) + "%";
const fmtD = d => { if(!d) return "—"; const p = d.split("-"); return p.length===3 ? `${p[2]}/${p[1]}/${p[0]}` : "—"; };
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

// ─── TEMA PREMIUM ───
// Paleta: navy profundo + gold #C9A84C. Tipografia sistema refinada + JetBrains Mono para números.
const C = {
  bg: "#060b14",
  bgDeep: "#03070e",
  surface: "#0c1322",
  surfaceAlt: "#111a2e",
  surfaceHi: "#162040",
  border: "#1a2540",
  borderHover: "#2a3d65",
  text: "#edf0f7",
  textMuted: "#8494b2",
  textDim: "#4d5f80",
  accent: "#c9a84c",
  accentDark: "#a88a35",
  accentBright: "#e6c263",
  accentGlow: "rgba(201,168,76,0.12)",
  green: "#34d399",
  red: "#f87171",
  amber: "#fbbf24",
  purple: "#a78bfa",
  cyan: "#22d3ee",
  navy: "#0B1A3B",
  navyLight: "#162449",
  gold: "#c9a84c"
};
const palette = ["#c9a84c","#a78bfa","#34d399","#22d3ee","#f87171","#ec4899","#6366f1","#14b8a6","#fbbf24","#f97316"];

// ─── COMPONENTS BASE ───
const MetricCard = ({label,value,color,sub,small,icon,trend}) => (
  <div style={{
    background: `linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: small ? "18px 20px" : "24px 26px",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(.4,0,.2,1)"
  }} onMouseEnter={e=>{
    e.currentTarget.style.borderColor = (color||C.accent) + "55";
    e.currentTarget.style.transform = "translateY(-3px)";
    e.currentTarget.style.boxShadow = `0 8px 24px ${color||C.accent}15`;
  }} onMouseLeave={e=>{
    e.currentTarget.style.borderColor = C.border;
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  }}>
    <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,background:`radial-gradient(circle,${(color||C.accent)}10,transparent 70%)`,borderRadius:"50%"}}/>
    {icon && <div style={{fontSize:18,marginBottom:8,opacity:0.7}}>{icon}</div>}
    <p style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{label}</p>
    <p style={{fontSize:small?22:30,fontWeight:800,color:color||C.text,letterSpacing:-1.2,lineHeight:1,fontFamily:"'JetBrains Mono','SF Mono',monospace"}}>{value}</p>
    {sub && <p style={{fontSize:11,color:C.textMuted,marginTop:8,lineHeight:1.3}}>{sub}</p>}
    {trend !== undefined && (
      <div style={{position:"absolute",top:16,right:16,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,background:(trend>=0?C.green:C.red)+"18",color:trend>=0?C.green:C.red}}>
        {trend>=0?"▲":"▼"} {Math.abs(trend).toFixed(1)}%
      </div>
    )}
  </div>
);

const ProgressBar = ({value,max,color,height=6}) => (
  <div style={{background:C.bg,borderRadius:height,height,width:"100%",overflow:"hidden"}}>
    <div style={{
      height:"100%",
      borderRadius:height,
      width:`${clamp((value/max)*100,0,100)}%`,
      background:`linear-gradient(90deg,${color},${color}aa)`,
      transition:"width 0.8s cubic-bezier(.4,0,.2,1)",
      boxShadow:`0 0 8px ${color}33`
    }}/>
  </div>
);

const Badge = ({text,color,size="md"}) => (
  <span style={{
    display: "inline-block",
    padding: size==="sm" ? "2px 8px" : "4px 12px",
    borderRadius: 20,
    fontSize: size==="sm" ? 9 : 10,
    fontWeight: 700,
    background: color + "15",
    color,
    border: `1px solid ${color}30`,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    whiteSpace: "nowrap"
  }}>{text}</span>
);

const Donut = ({segments,size=160,label}) => {
  const total = segments.reduce((s,x)=>s+x.value,0);
  if(!total) return null;
  const r=52, cx=65, cy=65, sw=14, circ=2*Math.PI*r;
  let off=0;
  return (
    <svg width={size} height={size} viewBox="0 0 130 130">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={sw} opacity="0.4"/>
      {segments.filter(s=>s.value>0).map((s,i)=>{
        const d = (s.value/total)*circ;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${d} ${circ-d}`} strokeDashoffset={-off} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 4px ${s.color}44)`}}/>;
        off += d;
        return el;
      })}
      <text x={cx} y={cy-2} textAnchor="middle" style={{fontSize:13,fontWeight:800,fill:C.text,fontFamily:"'JetBrains Mono',monospace"}}>{R$(total).replace("R$\u00a0","")}</text>
      {label && <text x={cx} y={cy+14} textAnchor="middle" style={{fontSize:9,fill:C.textDim}}>{label}</text>}
    </svg>
  );
};

const Spark = ({data,color=C.accent,w=120,h=36}) => {
  if(!data || !data.length) return null;
  const max = Math.max(...data,1), min = Math.min(...data,0), range = max-min||1;
  const pts = data.map((v,i)=>`${(i/(data.length-1||1))*w},${h-((v-min)/range)*h}`).join(" ");
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      <defs>
        <linearGradient id="spg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#spg)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{filter:`drop-shadow(0 0 3px ${color}55)`}}/>
    </svg>
  );
};

const TH = ({children,align}) => (
  <th style={{
    textAlign: align||"left",
    padding: "14px 16px",
    borderBottom: `2px solid ${C.border}`,
    color: C.textDim,
    fontWeight: 700,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    whiteSpace: "nowrap",
    background: C.bg + "88"
  }}>{children}</th>
);

const TD = ({children,mono,bold,color,align}) => (
  <td style={{
    padding: "13px 16px",
    borderBottom: `1px solid ${C.border}22`,
    color: color || C.text,
    fontFamily: mono ? "'JetBrains Mono','SF Mono',monospace" : "inherit",
    fontWeight: bold ? 700 : 400,
    fontSize: 13,
    textAlign: align || "left",
    whiteSpace: "nowrap"
  }}>{children}</td>
);

const Modal = ({children,onClose,title,wide}) => (
  <div style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    animation: "fadeIn 0.2s ease"
  }} onClick={onClose}>
    <div style={{
      background: `linear-gradient(180deg,${C.surface},${C.surfaceAlt})`,
      borderRadius: 24,
      border: `1px solid ${C.border}`,
      padding: "36px 40px",
      width: "92%",
      maxWidth: wide ? 720 : 540,
      maxHeight: "88vh",
      overflowY: "auto",
      animation: "slideUp 0.3s cubic-bezier(.4,0,.2,1)",
      boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 1px ${C.gold}33`
    }} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <h3 style={{fontSize:20,fontWeight:800,color:C.text,letterSpacing:-0.5}}>{title}</h3>
        <button onClick={onClose} style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          color: C.textMuted,
          cursor: "pointer",
          padding: "6px 10px",
          fontSize: 16,
          borderRadius: 10,
          transition: "all 0.2s"
        }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.red} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({label,children,hint}) => (
  <div style={{marginBottom:18}}>
    <label style={{display:"block",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>{label}</label>
    {children}
    {hint && <p style={{fontSize:11,color:C.textDim,marginTop:6}}>{hint}</p>}
  </div>
);

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  background: C.bg,
  color: C.text,
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.3s, box-shadow 0.3s"
};
const selectStyle = { ...inputStyle, cursor: "pointer" };
const btnPrimary = {
  padding: "12px 24px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: `linear-gradient(135deg,${C.gold},${C.accentDark})`,
  color: "#000",
  letterSpacing: 0.3,
  transition: "all 0.2s",
  boxShadow: `0 4px 16px ${C.accentGlow}`
};
const btnGhost = {
  padding: "9px 16px",
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  background: "transparent",
  color: C.textMuted,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  transition: "all 0.2s"
};

// ══════════════════════════════════════════════════════════════════
// ─── PORTAL DO CLIENTE ───
// Renderizado quando a URL contém ?portal=<token>
// Acesso completo: cronograma + status + custos + fotos + timeline + aditivos
// ══════════════════════════════════════════════════════════════════
function ClientPortal({ token, data }) {
  const clienteNome = PORTAL_TOKENS[token];
  const [tab, setTab] = useState("resumo");

  if (!clienteNome) {
    return (
      <div style={{minHeight:"100vh",background:C.bg,color:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",maxWidth:440,padding:40}}>
          <div style={{fontSize:56,marginBottom:16,opacity:0.3}}>🔒</div>
          <h1 style={{fontSize:24,fontWeight:800,marginBottom:12}}>Link inválido</h1>
          <p style={{color:C.textMuted,fontSize:14,lineHeight:1.6}}>Este link de portal não existe ou expirou. Entre em contato com a Felt Engenharia para obter um novo acesso.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{minHeight:"100vh",background:C.bg,color:C.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 20px"}}/>
          <p>Carregando seu portal...</p>
        </div>
      </div>
    );
  }

  const clientes = Object.values(data.clientes || {});
  const cobs = Object.values(data.cobrancas || {});
  const nfs = Object.values(data.nfs || {});
  const obras = Object.values(data.obras || {});
  const lancs = Object.values(data.lancamentos || {});
  const aditivos = Object.values(data.aditivos || {});

  const cliente = clientes.find(c => c.nome === clienteNome);
  if (!cliente) {
    return (
      <div style={{minHeight:"100vh",background:C.bg,color:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <p>Cliente não encontrado.</p>
      </div>
    );
  }

  // Encontrar obra correspondente via OBRA_CLIENTE_MAP (inverso)
  const obraMatch = (() => {
    for (const [oid, keys] of Object.entries(OBRA_CLIENTE_MAP)) {
      if (keys.some(k => clienteNome.toUpperCase().includes(k.toUpperCase()))) {
        return obras.find(o => o.id === oid);
      }
    }
    return null;
  })();

  const cobsCliente = cobs.filter(c => c.cliente === clienteNome).sort((a,b)=>(a.data||"").localeCompare(b.data||""));
  const nfsCliente = nfs.filter(n => n.cliente && clienteNome.toUpperCase().includes(n.cliente.toUpperCase().slice(0,8)));
  const aditivosCliente = aditivos.filter(a => a.cliente === clienteNome);

  const totalContrato = cliente.contrato || 0;
  const totalRecebido = cobsCliente.filter(c=>c.status==="RECEBIDO").reduce((s,c)=>s+(c.valor||0),0) + (cliente.pagoPre || 0);
  const totalAReceber = cobsCliente.filter(c=>c.status!=="RECEBIDO").reduce((s,c)=>s+(c.valor||0),0);
  const pctConcluido = totalContrato > 0 ? totalRecebido / totalContrato : 0;

  // Custos da obra (se houver obra linkada) - só o que é visível ao cliente
  const custoObra = obraMatch ? lancs.filter(l=>l.obraId===obraMatch.id && l.tipo==="obra").reduce((s,l)=>s+(l.valor||0),0) : 0;
  const lancsObra = obraMatch ? lancs.filter(l=>l.obraId===obraMatch.id && l.tipo==="obra").sort((a,b)=>(b.data||"").localeCompare(a.data||"")) : [];

  // Timeline de eventos (cobranças recebidas + marcos)
  const timeline = [
    ...cobsCliente.filter(c=>c.status==="RECEBIDO").map(c=>({
      tipo: "pagamento",
      data: c.data,
      titulo: `Pagamento recebido — ${R$(c.valor)}`,
      sub: c.obs || "Parcela"
    })),
    ...aditivosCliente.map(a=>({
      tipo: "aditivo",
      data: a.data,
      titulo: `Aditivo ${a.status==="aprovado"?"aprovado":"proposto"} — ${R$(a.valor)}`,
      sub: a.descricao
    }))
  ].sort((a,b)=>(b.data||"").localeCompare(a.data||""));

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'SF Pro Display','Inter',system-ui,sans-serif"}}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(180deg,${C.navy},${C.surface})`,
        borderBottom: `1px solid ${C.gold}22`,
        padding: "28px 0 24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,background:`radial-gradient(circle,${C.gold}15,transparent 60%)`,borderRadius:"50%"}}/>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `linear-gradient(135deg,${C.navy},${C.navyLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, color: C.gold,
                letterSpacing: -1,
                boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
                border: `1px solid ${C.gold}44`
              }}>FE</div>
              <div>
                <p style={{fontSize:12,color:C.gold,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Felt Engenharia · Portal do Cliente</p>
                <h1 style={{fontSize:24,fontWeight:900,letterSpacing:-0.5}}>{clienteNome}</h1>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:11,color:C.textDim,marginBottom:4}}>CONTRATO {cliente.ano}</p>
              <p style={{fontSize:20,fontWeight:800,color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{R$(totalContrato)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"32px"}}>

        {/* KPIs CLIENTE */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginBottom:28}}>
          <MetricCard label="Valor Pago" value={R$(totalRecebido)} color={C.green} sub={pct(pctConcluido) + " do contrato"}/>
          <MetricCard label="A Pagar" value={R$(totalAReceber)} color={C.cyan} sub={`${cobsCliente.filter(c=>c.status!=="RECEBIDO").length} parcelas pendentes`}/>
          <MetricCard label="Status da Obra" value={obraMatch?.status || cliente.status} color={C.accent}/>
          <MetricCard label="NFs Emitidas" value={nfsCliente.length + ""} color={C.purple} sub={R$(nfsCliente.reduce((s,n)=>s+(n.valor||0),0))}/>
        </div>

        {/* PROGRESSO */}
        <div style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2}}>Progresso Financeiro</p>
            <p style={{fontSize:13,fontWeight:800,color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{pct(pctConcluido)}</p>
          </div>
          <ProgressBar value={pctConcluido} max={1} color={C.gold} height={10}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:11,color:C.textMuted}}>
            <span>Pago: {R$(totalRecebido)}</span>
            <span>Saldo: {R$(totalContrato - totalRecebido)}</span>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap",borderBottom:`1px solid ${C.border}`,paddingBottom:0}}>
          {[
            {id:"resumo",label:"📊 Resumo"},
            {id:"cronograma",label:"📅 Cronograma de Pagamentos"},
            {id:"timeline",label:"📍 Timeline da Obra"},
            {id:"custos",label:"💰 Custos Aplicados"},
            {id:"documentos",label:"📄 Documentos & NFs"},
            {id:"aditivos",label:"✍️ Aditivos"}
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"10px 18px",
              border:"none",
              background:"transparent",
              color:tab===t.id?C.gold:C.textMuted,
              fontSize:12,
              fontWeight:tab===t.id?700:500,
              cursor:"pointer",
              borderBottom:`2px solid ${tab===t.id?C.gold:"transparent"}`,
              transition:"all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* TAB: RESUMO */}
        {tab === "resumo" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:16}}>
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Próximos Pagamentos</p>
              {cobsCliente.filter(c=>c.status!=="RECEBIDO").slice(0,5).map(c=>(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}44`}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:700}}>{fmtD(c.data)}</p>
                    <p style={{fontSize:11,color:C.textDim,marginTop:2}}>{c.obs || "Parcela"}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:15,fontWeight:800,color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{R$(c.valor)}</p>
                    <Badge text={c.status} color={FAT_STATUS_COLOR[c.status]||C.textMuted} size="sm"/>
                  </div>
                </div>
              ))}
              {cobsCliente.filter(c=>c.status!=="RECEBIDO").length === 0 && (
                <p style={{textAlign:"center",padding:"24px 0",color:C.textDim,fontSize:13}}>✅ Todos os pagamentos concluídos</p>
              )}
            </div>

            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Últimos Pagamentos Recebidos</p>
              {cobsCliente.filter(c=>c.status==="RECEBIDO").slice(-5).reverse().map(c=>(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}44`}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:700}}>{fmtD(c.data)}</p>
                    <p style={{fontSize:11,color:C.textDim,marginTop:2}}>{c.obs || "Parcela"}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:15,fontWeight:800,color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>{R$(c.valor)}</p>
                    <Badge text="RECEBIDO" color={C.green} size="sm"/>
                  </div>
                </div>
              ))}
              {cobsCliente.filter(c=>c.status==="RECEBIDO").length === 0 && (
                <p style={{textAlign:"center",padding:"24px 0",color:C.textDim,fontSize:13}}>Nenhum pagamento recebido ainda</p>
              )}
            </div>
          </div>
        )}

        {/* TAB: CRONOGRAMA */}
        {tab === "cronograma" && (
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    <TH>#</TH>
                    <TH>Data</TH>
                    <TH align="right">Valor</TH>
                    <TH>Descrição</TH>
                    <TH>Status</TH>
                  </tr>
                </thead>
                <tbody>
                  {cobsCliente.map((c,i)=>(
                    <tr key={c.id}>
                      <TD color={C.textDim}>{i+1}</TD>
                      <TD bold>{fmtD(c.data)}</TD>
                      <TD mono bold align="right">{R$(c.valor)}</TD>
                      <TD color={C.textDim}>{c.obs||"—"}</TD>
                      <TD><Badge text={c.status} color={FAT_STATUS_COLOR[c.status]||C.textMuted}/></TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:C.surfaceAlt}}>
                    <TD></TD>
                    <TD bold color={C.gold}>TOTAL</TD>
                    <TD mono bold align="right" color={C.gold}>{R$(cobsCliente.reduce((s,c)=>s+(c.valor||0),0))}</TD>
                    <TD></TD>
                    <TD></TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB: TIMELINE */}
        {tab === "timeline" && (
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"28px 32px"}}>
            {timeline.length === 0 ? (
              <p style={{textAlign:"center",padding:"40px 0",color:C.textDim,fontSize:13}}>Nenhum evento registrado ainda</p>
            ) : (
              <div style={{position:"relative",paddingLeft:28}}>
                <div style={{position:"absolute",left:10,top:8,bottom:8,width:2,background:`linear-gradient(180deg,${C.gold},${C.border})`}}/>
                {timeline.map((t,i)=>(
                  <div key={i} style={{marginBottom:24,position:"relative"}}>
                    <div style={{
                      position:"absolute",
                      left:-24,
                      top:4,
                      width:14,
                      height:14,
                      borderRadius:"50%",
                      background: t.tipo==="aditivo" ? C.purple : C.green,
                      border:`3px solid ${C.bg}`,
                      boxShadow:`0 0 0 2px ${t.tipo==="aditivo"?C.purple:C.green}55`
                    }}/>
                    <p style={{fontSize:11,color:C.textDim,marginBottom:4}}>{fmtD(t.data)}</p>
                    <p style={{fontSize:14,fontWeight:700,color:C.text}}>{t.titulo}</p>
                    {t.sub && <p style={{fontSize:12,color:C.textMuted,marginTop:4}}>{t.sub}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CUSTOS */}
        {tab === "custos" && (
          <div>
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2}}>Investimento da Felt na Obra</p>
                <p style={{fontSize:22,fontWeight:800,color:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{R$(custoObra)}</p>
              </div>
              <p style={{fontSize:12,color:C.textMuted,lineHeight:1.6}}>Valor investido em materiais, mão de obra e serviços aplicados na obra. Transparência total sobre o que foi executado.</p>
            </div>
            {lancsObra.length > 0 ? (
              <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr>
                        <TH>Data</TH>
                        <TH>Descrição</TH>
                        <TH>Categoria</TH>
                        <TH align="right">Valor</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {lancsObra.map(l=>(
                        <tr key={l.id}>
                          <TD>{fmtD(l.data)}</TD>
                          <TD bold>{l.descricao}</TD>
                          <TD><Badge text={l.centroCusto} color={C.purple} size="sm"/></TD>
                          <TD mono bold align="right">{R$(l.valor)}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"40px",textAlign:"center"}}>
                <p style={{color:C.textDim,fontSize:13}}>Custos serão atualizados conforme a obra avança</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: DOCUMENTOS */}
        {tab === "documentos" && (
          <div>
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:16}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Notas Fiscais Emitidas</p>
              {nfsCliente.length > 0 ? (
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <TH>Data</TH>
                      <TH>Referente</TH>
                      <TH align="right">Valor</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {nfsCliente.map(n=>(
                      <tr key={n.id}>
                        <TD>{fmtD(n.data)}</TD>
                        <TD bold>{n.cliente}</TD>
                        <TD mono bold align="right">{R$(n.valor)}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{color:C.textDim,fontSize:13,padding:"20px 0",textAlign:"center"}}>Nenhuma NF emitida ainda</p>
              )}
            </div>
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Documentos Técnicos</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                {[
                  {icon:"📋",titulo:"ART Registrada",sub:"Anotação de Responsabilidade Técnica"},
                  {icon:"📐",titulo:"Projeto Aprovado",sub:"Plantas e memoriais"},
                  {icon:"📹",titulo:"Tour 360°",sub:"Visita virtual da obra"},
                  {icon:"📊",titulo:"RDO",sub:"Relatório Diário de Obra"}
                ].map((d,i)=>(
                  <div key={i} style={{
                    background:C.bg,
                    borderRadius:12,
                    border:`1px solid ${C.border}`,
                    padding:"18px",
                    cursor:"pointer",
                    transition:"all 0.2s"
                  }} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"66";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
                    <div style={{fontSize:28,marginBottom:10}}>{d.icon}</div>
                    <p style={{fontSize:13,fontWeight:700,marginBottom:4}}>{d.titulo}</p>
                    <p style={{fontSize:11,color:C.textDim}}>{d.sub}</p>
                    <p style={{fontSize:10,color:C.textDim,marginTop:10,fontStyle:"italic"}}>Em breve disponível</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ADITIVOS */}
        {tab === "aditivos" && (
          <div>
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:16}}>
              <p style={{fontSize:12,color:C.textMuted,lineHeight:1.6}}>Aditivos são mudanças no escopo ou valor do contrato. Eventuais aditivos propostos aparecerão aqui para sua aprovação.</p>
            </div>
            {aditivosCliente.length === 0 ? (
              <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"40px",textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>✍️</div>
                <p style={{color:C.textDim,fontSize:13}}>Nenhum aditivo registrado</p>
              </div>
            ) : (
              <div style={{display:"grid",gap:12}}>
                {aditivosCliente.map(a=>(
                  <div key={a.id} style={{background:C.surface,borderRadius:16,border:`1px solid ${a.status==="aprovado"?C.green:C.amber}44`,padding:"20px 24px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <p style={{fontSize:11,color:C.textDim,marginBottom:4}}>{fmtD(a.data)}</p>
                        <p style={{fontSize:15,fontWeight:800}}>{a.descricao}</p>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <p style={{fontSize:18,fontWeight:800,color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{R$(a.valor)}</p>
                        <Badge text={a.status} color={a.status==="aprovado"?C.green:C.amber}/>
                      </div>
                    </div>
                    {a.status === "pendente" && (
                      <div style={{display:"flex",gap:8,marginTop:14}}>
                        <button onClick={()=>{
                          const key = Object.keys(data.aditivos||{}).find(k => (data.aditivos[k].id === a.id || k === a.id));
                          if (key) update(ref(fdb,`aditivos/${key}`),{status:"aprovado"});
                        }} style={{...btnPrimary,padding:"10px 18px",fontSize:12}}>✓ Aprovar</button>
                        <button onClick={()=>{
                          const key = Object.keys(data.aditivos||{}).find(k => (data.aditivos[k].id === a.id || k === a.id));
                          if (key) update(ref(fdb,`aditivos/${key}`),{status:"recusado"});
                        }} style={{...btnGhost,padding:"10px 18px",fontSize:12,borderColor:C.red+"44",color:C.red}}>✕ Recusar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div style={{marginTop:48,padding:"24px 0",borderTop:`1px solid ${C.border}`,textAlign:"center"}}>
          <p style={{fontSize:11,color:C.textDim}}>Felt Engenharia · Gestão Premium de Reformas</p>
          <p style={{fontSize:10,color:C.textDim,marginTop:4}}>Portal atualizado em tempo real · Dúvidas? Entre em contato com seu engenheiro responsável</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ═══════════════════════════ APP ═══════════════════════════════
// ══════════════════════════════════════════════════════════════════
function App() {
  // Detectar se é portal do cliente via URL ?portal=<token>
  const urlParams = new URLSearchParams(window.location.search);
  const portalToken = urlParams.get("portal");

  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [user,setUser] = useState(null);
  const [page,setPage] = useState("dashboard");
  const [loginForm,setLoginForm] = useState({username:"",password:""});
  const [loginErr,setLoginErr] = useState("");
  const [modal,setModal] = useState(null);
  const [selObra,setSelObra] = useState(null);
  const [filterMes,setFilterMes] = useState("todos");
  const [sideCollapsed,setSideCollapsed] = useState(false);
  const [toast,setToast] = useState(null);
  const [search,setSearch] = useState("");
  const [mobileNav,setMobileNav] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),2500); };

  useEffect(()=>{
    const dbRef = ref(fdb,"/");
    const unsub = onValue(dbRef, snap => {
      const val = snap.val();
      if (val && val.obras) {
        setData(val);
        // Migração: se não tem equipe/diarias, adicionar
        const hasEquipe = val.equipe && Object.keys(val.equipe).length > 0;
        if (!hasEquipe) {
          const seed = buildSeed();
          update(ref(fdb,"/"), { equipe:seed.equipe, diarias:seed.diarias });
        }
      } else {
        const seed = buildSeed();
        set(ref(fdb,"/"), seed).then(()=>setData(seed));
      }
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return ()=>unsub();
  },[]);

  // Se for portal do cliente, renderizar portal (não precisa de login)
  if (portalToken) {
    return <ClientPortal token={portalToken} data={data} />;
  }

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,color:C.textMuted}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 20px"}}/>
        <p>Conectando ao servidor...</p>
      </div>
    </div>
  );
  if (!data) return <div style={{padding:40,color:C.text,background:C.bg}}>Erro ao conectar.</div>;

  // ─── LOGIN ───
  if (!user) {
    const doLogin = () => {
      const found = USERS.find(u => u.username === loginForm.username && u.password === loginForm.password);
      if (found) {
        setUser(found);
        setLoginErr("");
        if (found.role === "diarista") setPage("funcionarios");
      } else setLoginErr("Credenciais inválidas");
    };
    return (
      <div style={{
        minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
        background:`radial-gradient(ellipse at 20% 30%,${C.accentGlow},transparent 50%),radial-gradient(ellipse at 80% 70%,rgba(167,139,250,0.04),transparent 50%),${C.bg}`
      }}>
        <div style={{
          width:420,padding:"56px 44px",borderRadius:28,
          background:`linear-gradient(180deg,${C.surface},${C.surfaceAlt})`,
          border:`1px solid ${C.border}`,
          animation:"slideUp 0.5s ease",
          boxShadow:`0 48px 96px rgba(0,0,0,0.5),0 0 0 1px ${C.gold}11`
        }}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <div style={{
              width:72,height:72,borderRadius:20,margin:"0 auto 20px",
              background:`linear-gradient(135deg,${C.navy},${C.navyLight})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:26,fontWeight:900,color:C.gold,letterSpacing:-2,
              boxShadow:`0 12px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)`,
              border:`1px solid ${C.gold}33`
            }}>FE</div>
            <h1 style={{fontSize:28,fontWeight:900,color:C.text,letterSpacing:-1}}>Felt Engenharia</h1>
            <p style={{fontSize:13,color:C.textDim,marginTop:8}}>Sistema de Gestão Executiva</p>
            <div style={{width:40,height:2,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"16px auto 0"}}/>
          </div>
          <Field label="Usuário">
            <input value={loginForm.username} onChange={e=>setLoginForm(p=>({...p,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="seu login" style={inputStyle}/>
          </Field>
          <Field label="Senha">
            <input type="password" value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" style={inputStyle}/>
          </Field>
          {loginErr && <p style={{color:C.red,fontSize:12,marginBottom:12,fontWeight:600}}>{loginErr}</p>}
          <button onClick={doLogin} style={{...btnPrimary,width:"100%",justifyContent:"center",padding:"15px 0",marginTop:10,fontSize:15,borderRadius:14}}>Acessar Sistema</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // DADOS COMPUTADOS — CORRIGIDOS
  // ══════════════════════════════════════════════════════════════
  const obras = Object.values(data.obras || {});
  const lancs = Object.values(data.lancamentos || {});
  const obraLancs = oid => lancs.filter(l => l.obraId === oid && l.tipo === "obra");

  const staffList = Object.values(data.equipe || {}).filter(e => e.ativo !== false);
  const diariasList = Object.values(data.diarias || {});
  const mensalistas = staffList.filter(s => s.tipo === "mensalista");
  const diaristas = staffList.filter(s => s.tipo === "diarista");
  const obrasAtivas = obras.filter(o => o.status === "Em andamento");

  // ── CORREÇÃO: Rateio igual entre obras em andamento ──
  // Cada mês gera um custo de salários totais, dividido igualmente pelas obras ativas.
  const totalSalariosMensal = mensalistas.reduce((s,m)=>s+(m.salario||0),0);
  const rateioPorObra = obrasAtivas.length > 0 ? totalSalariosMensal / obrasAtivas.length : 0;

  // Quantos meses de atividade temos? Considera meses onde houve QUALQUER lançamento 2026
  // (mais robusto que depender só de diárias)
  const mesesAtividade2026 = [...new Set(
    lancs
      .filter(l => l.data && l.data.startsWith("2026"))
      .map(l => l.data.slice(0,7))
  )].sort();
  const numMeses = mesesAtividade2026.length || 1;

  // Custo de diaristas por obra (soma de diárias registradas × valor da diária)
  const diariasCustoObra = oid => {
    let total = 0;
    diaristas.forEach(s => {
      const dias = diariasList.filter(d => d.equipeId === s.id && d.obraId === oid).length;
      total += dias * (s.valorDiaria || 0);
    });
    return total;
  };

  // Rateio mensalista: só se a obra está em andamento. Custo = rateio mensal × nº de meses
  const mensalistaCustoObra = oid => {
    const obra = obras.find(o => o.id === oid);
    if (!obra || obra.status !== "Em andamento") return 0;
    return rateioPorObra * numMeses;
  };

  // Custos operacionais por obra (alimentação equipe, combustível, etc quando alocados)
  const custosOpObra = oid => lancs
    .filter(l => l.obraId === oid && l.tipo === "operacional")
    .reduce((s,l)=>s+(l.valor||0),0);

  // Custo total por obra: lançamentos diretos + diárias + rateio mensalistas + operacional
  const custoObra = oid => (
    obraLancs(oid).reduce((s,l)=>s+(l.valor||0),0) +
    diariasCustoObra(oid) +
    mensalistaCustoObra(oid) +
    custosOpObra(oid)
  );

  const custoFuncTotal = totalSalariosMensal * numMeses;
  const custoDiariasTotal = diaristas.reduce((s,st)=>{
    const dias = diariasList.filter(d => d.equipeId === st.id).length;
    return s + dias * (st.valorDiaria || 0);
  }, 0);
  const custoAdm = lancs.filter(l=>l.tipo==="administrativo").reduce((s,l)=>s+(l.valor||0),0);
  const custoTotalObras = obras.reduce((s,o)=>s+custoObra(o.id), 0);
  const custoGeral = custoTotalObras + custoAdm;
  const faturamento = obras.reduce((s,o)=>s+(o.contrato||0), 0);
  const lucroGeral = faturamento - custoGeral;
  const margemGeral = faturamento > 0 ? lucroGeral/faturamento : 0;

  const meses = [...new Set(lancs.map(l=>l.data?.slice(0,7)).filter(Boolean))].sort();
  const custoMes = {};
  meses.forEach(m => { custoMes[m] = lancs.filter(l=>l.data?.startsWith(m)).reduce((s,l)=>s+(l.valor||0),0); });

  // ── KPIs por obra CORRIGIDOS ──
  // Obras em andamento SEM nenhum custo lançado (além do rateio automático) são sinalizadas como "aguardando início"
  const obraKPIs = obras.map((o,idx) => {
    const custo = custoObra(o.id);
    const custoDireto = obraLancs(o.id).reduce((s,l)=>s+(l.valor||0),0);
    const imp = (o.contrato||0) * (o.aliquota||0);
    const rtV = (o.contrato||0) * (o.rt||0);
    const recLiq = (o.contrato||0) - imp - rtV;
    const lb = (o.contrato||0) - custo;
    const ll = recLiq - custo;
    const m = o.contrato > 0 ? lb/o.contrato : 0;
    const ml = o.contrato > 0 ? ll/o.contrato : 0;
    const roi = custo > 0 ? ((o.contrato||0) - custo) / custo : 0;
    const ex = o.contrato > 0 ? custo/o.contrato : 0;
    const semDadosReais = custoDireto === 0 && diariasCustoObra(o.id) === 0;
    return {
      ...o, custo, custoDireto, imposto:imp, rtVal:rtV, recLiq,
      lucroBruto:lb, lucroLiq:ll, margem:m, margemLiq:ml, roi, execucao:ex,
      semDadosReais,
      color: palette[idx % palette.length]
    };
  });

  const isAdmin = user.role === "admin";
  const isDiarista = user.role === "diarista";
  const visibleNav = isDiarista
    ? [{id:"funcionarios",label:"Equipe",emoji:"👷"}]
    : [
        {id:"dashboard",label:"Dashboard",emoji:"📊"},
        {id:"obras",label:"Obras",emoji:"🏗️"},
        {id:"faturamento",label:"Faturamento",emoji:"💰"},
        {id:"funcionarios",label:"Equipe",emoji:"👷"},
        {id:"operacional",label:"Operacional",emoji:"⛽"},
        {id:"administrativo",label:"Admin",emoji:"💼"},
        {id:"kpis",label:"KPIs",emoji:"🎯"},
        {id:"portais",label:"Portais Cliente",emoji:"🔑"},
        {id:"historico",label:"Histórico",emoji:"📝"}
      ];

  // ══════════════════════════════════════════════════════════════
  // CRUD FIREBASE
  // ══════════════════════════════════════════════════════════════
  const fbLog = (acao,detalhe) => {
    const id = uid();
    set(ref(fdb,`auditLog/${id}`), {id,acao,detalhe,usuario:user?.nome||"?",timestamp:new Date().toISOString()});
  };

  const fbAddObra = o => { const id = uid(); set(ref(fdb,`obras/${id}`),{...o,id}); showToast("Obra criada"); };
  const fbEditObra = (id,u) => { update(ref(fdb,`obras/${id}`),u); showToast("Obra atualizada"); };
  const fbDelObra = id => {
    remove(ref(fdb,`obras/${id}`));
    lancs.filter(l=>l.obraId===id).forEach(l=>{
      const key = Object.keys(data.lancamentos||{}).find(k => data.lancamentos[k].id === l.id || k === l.id);
      if (key) remove(ref(fdb,`lancamentos/${key}`));
    });
    setSelObra(null);
    showToast("Obra removida");
  };

  const fbAddLanc = l => {
    const id = uid();
    set(ref(fdb,`lancamentos/${id}`), {...l,id});
    fbLog("Lançamento criado", l.descricao + " — " + l.valor);
    showToast("Lançamento registrado");
  };
  const fbEditLanc = (lancId,u) => {
    // Encontrar a chave real do Firebase
    const key = Object.keys(data.lancamentos||{}).find(k => data.lancamentos[k].id === lancId || k === lancId);
    if (!key) { console.error("Lanc não encontrado:", lancId); return; }
    update(ref(fdb,`lancamentos/${key}`), u);
    fbLog("Lançamento editado", u.descricao || lancId);
    showToast("Atualizado");
  };
  const fbDelLanc = lancId => {
    const key = Object.keys(data.lancamentos||{}).find(k => data.lancamentos[k].id === lancId || k === lancId);
    if (!key) return;
    const old = data.lancamentos[key];
    remove(ref(fdb,`lancamentos/${key}`));
    fbLog("Lançamento removido", old?.descricao || lancId);
    showToast("Removido");
  };

  // ════════════════════════════════════════════════════════════════
  // CORREÇÕES CRÍTICAS — COBRANÇAS
  // ════════════════════════════════════════════════════════════════
  // Helper: encontrar a chave real do Firebase para uma cobrança.
  // Funciona mesmo se cob.id for diferente da chave (ex: seed usa "cb1" como id E chave).
  const findCobKey = cobId => {
    if (!data.cobrancas) return null;
    // 1. Se cobId já é uma chave direta
    if (data.cobrancas[cobId]) return cobId;
    // 2. Senão, procurar por .id
    return Object.keys(data.cobrancas).find(k => data.cobrancas[k]?.id === cobId) || null;
  };

  const fbAddCob = c => {
    const id = uid();
    // IMPORTANTE: id interno === chave Firebase (evita divergência)
    set(ref(fdb,`cobrancas/${id}`), {...c, id});
    fbLog("Cobrança criada", c.cliente + " — " + c.valor);
    showToast("Cobrança registrada");
  };

  // CORREÇÃO: usar update() em vez de set() para preservar campos não enviados
  const fbEditCob = (cobId,u) => {
    const key = findCobKey(cobId);
    if (!key) { console.error("Cob não encontrada para edição:", cobId); showToast("Erro: cobrança não encontrada"); return; }
    update(ref(fdb,`cobrancas/${key}`), u);
    fbLog("Cobrança editada", u.cliente || cobId);
    showToast("Cobrança atualizada");
  };

  // CORREÇÃO PRINCIPAL: status agora usa update() e preserva todos os outros campos
  // Antes o bug era: fbStatusCob usava set() que substituia tudo. Se id/fbKey divergissem,
  // o match falhava silenciosamente e nada era salvo.
  const fbStatusCob = (cobId, novoStatus) => {
    const key = findCobKey(cobId);
    if (!key) {
      console.error("Cob não encontrada para status:", cobId);
      showToast("Erro: cobrança não encontrada");
      return;
    }
    const cob = data.cobrancas[key];
    const patch = { status: novoStatus };
    if (novoStatus === "RECEBIDO") {
      patch.dataRecebimento = new Date().toISOString().slice(0,10);
    }
    update(ref(fdb,`cobrancas/${key}`), patch);
    fbLog("Status cobrança", `${cob.cliente}: ${cob.status} → ${novoStatus}`);
    showToast(`${cob.cliente} → ${novoStatus}`);
  };

  const fbDelCob = cobId => {
    const key = findCobKey(cobId);
    if (!key) return;
    const old = data.cobrancas[key];
    remove(ref(fdb,`cobrancas/${key}`));
    fbLog("Cobrança removida", old?.cliente || cobId);
    showToast("Removido");
  };

  const fbAddNf = n => { const id = uid(); set(ref(fdb,`nfs/${id}`),{...n,id}); fbLog("NF registrada",n.cliente); showToast("NF registrada"); };
  const fbDelNf = nfId => {
    const key = Object.keys(data.nfs||{}).find(k => data.nfs[k].id === nfId || k === nfId);
    if (!key) return;
    remove(ref(fdb,`nfs/${key}`));
    fbLog("NF removida", nfId);
    showToast("NF removida");
  };

  // Aditivos (portal)
  const fbAddAditivo = a => {
    const id = uid();
    set(ref(fdb,`aditivos/${id}`), {...a,id,status:"pendente"});
    fbLog("Aditivo criado", a.cliente + " — " + a.valor);
    showToast("Aditivo enviado ao cliente");
  };

  // Equipe
  const fbAddStaff = s => { const id = uid(); set(ref(fdb,`equipe/${id}`),{...s,id,ativo:true}); fbLog("Funcionário cadastrado",s.nome); showToast("Funcionário cadastrado"); };
  const fbEditStaff = (staffId,u) => {
    const key = Object.keys(data.equipe||{}).find(k => data.equipe[k].id === staffId || k === staffId);
    if (!key) return;
    update(ref(fdb,`equipe/${key}`), u);
    fbLog("Funcionário editado", u.nome || staffId);
    showToast("Atualizado");
  };
  const fbDelStaff = staffId => {
    const key = Object.keys(data.equipe||{}).find(k => data.equipe[k].id === staffId || k === staffId);
    if (!key) return;
    update(ref(fdb,`equipe/${key}`), {ativo:false});
    fbLog("Funcionário desativado", staffId);
    showToast("Desativado");
  };
  const fbAddDiaria = d => { const id = uid(); set(ref(fdb,`diarias/${id}`),{...d,id}); showToast("Diária registrada"); };
  const fbDelDiaria = dId => {
    const key = Object.keys(data.diarias||{}).find(k => data.diarias[k].id === dId || k === dId);
    if (!key) return;
    remove(ref(fdb,`diarias/${key}`));
    showToast("Diária removida");
  };

  // Auditoria
  const auditLogs = Object.values(data.auditLog || {}).sort((a,b)=>(b.timestamp||"").localeCompare(a.timestamp||"")).slice(0,50);

  // Cobranças, clientes, NFs
  const cobs = Object.values(data.cobrancas || {});
  const clientes = Object.values(data.clientes || {});
  const nfsList = Object.values(data.nfs || {});
  const aditivos = Object.values(data.aditivos || {});

  const totalRecebido = cobs.filter(c=>c.status==="RECEBIDO").reduce((s,c)=>s+(c.valor||0),0);
  const totalAVencer = cobs.filter(c=>c.status==="A VENCER").reduce((s,c)=>s+(c.valor||0),0);
  const totalVencido = cobs.filter(c=>c.status==="VENCIDO").reduce((s,c)=>s+(c.valor||0),0);
  const totalProximo = cobs.filter(c=>c.status==="PROXIMO").reduce((s,c)=>s+(c.valor||0),0);
  const portfolioTotal = clientes.reduce((s,c)=>s+(c.contrato||0), 0);
  const portfolioRecebido = clientes.reduce((s,c)=>s+(c.pagoPre||0),0) + totalRecebido;
  const portfolioAReceber = portfolioTotal - portfolioRecebido;
  const obraRecebido = oid => {
    const keys = OBRA_CLIENTE_MAP[oid] || [];
    if (!keys.length) return 0;
    return cobs.filter(c =>
      c.status === "RECEBIDO" &&
      keys.some(k => c.cliente?.toUpperCase().includes(k.toUpperCase()))
    ).reduce((s,c)=>s+(c.valor||0), 0);
  };

  const matchSearch = text => !search || text?.toLowerCase().includes(search.toLowerCase());
  const filterLancs = (tipo,obraId=null) => {
    let l = lancs.filter(x=>x.tipo===tipo);
    if (obraId) l = l.filter(x=>x.obraId===obraId);
    if (filterMes !== "todos") l = l.filter(x=>x.data?.startsWith(filterMes));
    return l.sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  };

  const allCC = [...new Set([...CC_OBRA_DEFAULT, ...lancs.map(l=>l.centroCusto).filter(Boolean)])].sort();

  // Strategic computed
  const MESES_ALL = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  const hoje = new Date("2026-04-15");
  const em7 = new Date(hoje); em7.setDate(em7.getDate()+7);
  const em30 = new Date(hoje); em30.setDate(em30.getDate()+30);
  const recMes = {};
  cobs.filter(c=>c.status==="RECEBIDO").forEach(c=>{
    const m = c.data?.slice(0,7);
    if (m) recMes[m] = (recMes[m]||0) + (c.valor||0);
  });
  const despMes = {};
  lancs.forEach(l=>{
    const m = l.data?.slice(0,7);
    if (m) despMes[m] = (despMes[m]||0) + (l.valor||0);
  });
  const fluxoMeses = ["2026-01","2026-02","2026-03"];
  const fluxoData = fluxoMeses.map(m=>({
    m, label: MESES_ALL[parseInt(m.slice(5))-1],
    rec: recMes[m]||0,
    desp: despMes[m]||0,
    saldo: (recMes[m]||0) - (despMes[m]||0)
  }));
  let saldoAcum = 0;
  fluxoData.forEach(f => { saldoAcum += f.saldo; f.acumulado = saldoAcum; });
  const mesesComDesp = Object.keys(despMes).filter(m=>m.startsWith("2026"));
  const burnRate = mesesComDesp.length > 0 ? mesesComDesp.reduce((s,m)=>s+(despMes[m]||0),0)/mesesComDesp.length : 0;
  const inadimplencia = portfolioTotal > 0 ? totalVencido/portfolioTotal : 0;
  const clientesSorted = [...clientes].sort((a,b)=>(b.contrato||0) - (a.contrato||0));
  const top3Valor = clientesSorted.slice(0,3).reduce((s,c)=>s+(c.contrato||0), 0);
  const concentracao = portfolioTotal > 0 ? top3Valor/portfolioTotal : 0;
  const moRatioObras = obraKPIs.map(o => {
    const mo = obraLancs(o.id).filter(l=>l.centroCusto==="MÃO DE OBRA").reduce((s,l)=>s+(l.valor||0),0);
    return { ...o, moVal:mo, moRatio: o.contrato>0 ? mo/o.contrato : 0 };
  });
  const cobsEm7 = cobs.filter(c=>{
    if (c.status==="RECEBIDO") return false;
    const d = new Date(c.data);
    return d >= hoje && d <= em7;
  });
  const cobsVencidas = cobs.filter(c=>c.status==="VENCIDO");
  // ── KPI: obras de risco — só considera obras com dados reais lançados ──
  const obrasRisco = obraKPIs.filter(o => !o.semDadosReais && o.execucao>0.6 && o.margem<0.2 && o.custo>0);
  const prox30 = cobs.filter(c=>{
    if (c.status==="RECEBIDO") return false;
    const d = new Date(c.data);
    return d >= hoje && d <= em30;
  }).sort((a,b)=>(a.data||"").localeCompare(b.data||""));
  const prox30Total = prox30.reduce((s,c)=>s+(c.valor||0), 0);

  // ══════════════════════════════════════════════════════════════
  // FORMS
  // ══════════════════════════════════════════════════════════════
  const LancForm = ({initial,tipo,onClose}) => {
    const [f,setF] = useState(initial || {
      descricao: "", valor: "",
      data: new Date().toISOString().slice(0,10),
      centroCusto: tipo==="obra"?"MATERIAL":tipo==="funcionario"?"TIAGO":"CONTABILIDADE",
      obs: "",
      obraId: selObra || (obras[0]?.id ?? ""),
      tipo
    });
    const cc = tipo==="obra" ? allCC : tipo==="funcionario" ? CC_FUNC : CC_ADM;
    const doSave = () => {
      if (!f.descricao || !f.valor) return;
      const d = { ...f, valor: parseFloat(f.valor) };
      if (initial) fbEditLanc(initial.id, d);
      else fbAddLanc(d);
      onClose();
    };
    return (
      <Modal title={initial?"Editar Lançamento":"Novo Lançamento"} onClose={onClose}>
        {tipo==="obra" && (
          <Field label="Obra">
            <select value={f.obraId} onChange={e=>setF(p=>({...p,obraId:e.target.value}))} style={selectStyle}>
              {obras.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </Field>
        )}
        <Field label="Descrição">
          <input value={f.descricao} onChange={e=>setF(p=>({...p,descricao:e.target.value}))} style={inputStyle}/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <Field label={tipo==="obra"?"Centro de Custo (selecione ou digite novo)":"Centro de Custo"}>
          {tipo==="obra" ? (
            <>
              <input list="cc-list" value={f.centroCusto} onChange={e=>setF(p=>({...p,centroCusto:e.target.value.toUpperCase()}))} style={inputStyle} placeholder="Selecione ou digite..."/>
              <datalist id="cc-list">{cc.map(c=><option key={c} value={c}/>)}</datalist>
            </>
          ) : (
            <select value={f.centroCusto} onChange={e=>setF(p=>({...p,centroCusto:e.target.value}))} style={selectStyle}>
              {cc.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </Field>
        <Field label="Observações">
          <input value={f.obs} onChange={e=>setF(p=>({...p,obs:e.target.value}))} style={inputStyle}/>
        </Field>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Registrar"}</button>
      </Modal>
    );
  };

  const ObraForm = ({initial,onClose}) => {
    const [f,setF] = useState(initial ? {
      nome: initial.nome,
      contrato: initial.contrato,
      aliquota: (initial.aliquota||0) * 100,
      rt: (initial.rt||0) * 100,
      status: initial.status
    } : { nome:"", contrato:"", aliquota:0, rt:0, status:"Em andamento" });
    const doSave = () => {
      if (!f.nome || !f.contrato) return;
      const d = {
        nome: f.nome,
        contrato: parseFloat(f.contrato),
        aliquota: (parseFloat(f.aliquota)||0)/100,
        rt: (parseFloat(f.rt)||0)/100,
        status: f.status
      };
      if (initial) fbEditObra(initial.id, d);
      else fbAddObra(d);
      onClose();
    };
    return (
      <Modal title={initial?"Editar Obra":"Nova Obra"} onClose={onClose}>
        <Field label="Nome">
          <input value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value}))} style={inputStyle}/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Contrato (R$)">
            <input type="number" value={f.contrato} onChange={e=>setF(p=>({...p,contrato:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={selectStyle}>
              {STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Alíquota (%)">
            <input type="number" step="0.01" value={f.aliquota} onChange={e=>setF(p=>({...p,aliquota:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="RT (%)">
            <input type="number" step="0.01" value={f.rt} onChange={e=>setF(p=>({...p,rt:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Criar Obra"}</button>
      </Modal>
    );
  };

  const CobForm = ({initial,onClose}) => {
    const [f,setF] = useState(initial || {
      data: new Date().toISOString().slice(0,10),
      cliente: "", valor: "",
      status: "A VENCER", obs: ""
    });
    const doSave = () => {
      if (!f.cliente || !f.valor) return;
      const d = { ...f, valor: parseFloat(f.valor) };
      if (initial) fbEditCob(initial.id, d);
      else fbAddCob(d);
      onClose();
    };
    return (
      <Modal title={initial?"Editar Cobrança":"Nova Cobrança"} onClose={onClose}>
        <Field label="Cliente / Obra">
          <input list="cliente-list" value={f.cliente} onChange={e=>setF(p=>({...p,cliente:e.target.value}))} style={inputStyle} placeholder="Ex: HL 227"/>
          <datalist id="cliente-list">{clientes.map(c=><option key={c.id} value={c.nome}/>)}</datalist>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <Field label="Status">
          <select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={selectStyle}>
            {FAT_STATUS.map(s=><option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Observação">
          <input value={f.obs} onChange={e=>setF(p=>({...p,obs:e.target.value}))} style={inputStyle} placeholder="Ex: 3a parcela — SALDO FINAL"/>
        </Field>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Registrar"}</button>
      </Modal>
    );
  };

  const StaffForm = ({initial,onClose}) => {
    const [f,setF] = useState(initial || {
      nome:"", funcao:"PEDREIRO", tipo:"diarista", valorDiaria:0, salario:0
    });
    const doSave = () => {
      if (!f.nome) return;
      const d = {
        nome: f.nome,
        funcao: f.funcao,
        tipo: f.tipo,
        valorDiaria: parseFloat(f.valorDiaria)||0,
        salario: parseFloat(f.salario)||0
      };
      if (initial) fbEditStaff(initial.id, d);
      else fbAddStaff(d);
      onClose();
    };
    return (
      <Modal title={initial?"Editar Funcionário":"Novo Funcionário"} onClose={onClose}>
        <Field label="Nome">
          <input value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value}))} style={inputStyle}/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Função">
            <select value={f.funcao} onChange={e=>setF(p=>({...p,funcao:e.target.value}))} style={selectStyle}>
              {FUNCOES.map(fx=><option key={fx}>{fx}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select value={f.tipo} onChange={e=>setF(p=>({...p,tipo:e.target.value}))} style={selectStyle}>
              <option value="diarista">Diarista</option>
              <option value="mensalista">Mensalista</option>
            </select>
          </Field>
        </div>
        {f.tipo === "diarista" ? (
          <Field label="Valor da Diária (R$)" hint="Valor pago por dia de trabalho">
            <input type="number" value={f.valorDiaria} onChange={e=>setF(p=>({...p,valorDiaria:e.target.value}))} style={inputStyle}/>
          </Field>
        ) : (
          <Field label="Salário Mensal (R$)" hint={`Será rateado igualmente entre obras em andamento (${obrasAtivas.length} hoje)`}>
            <input type="number" value={f.salario} onChange={e=>setF(p=>({...p,salario:e.target.value}))} style={inputStyle}/>
          </Field>
        )}
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Cadastrar"}</button>
      </Modal>
    );
  };

  const AditivoForm = ({onClose}) => {
    const [f,setF] = useState({
      data: new Date().toISOString().slice(0,10),
      cliente: "", valor: "", descricao: ""
    });
    const doSave = () => {
      if (!f.cliente || !f.valor || !f.descricao) return;
      fbAddAditivo({ ...f, valor: parseFloat(f.valor) });
      onClose();
    };
    // Só clientes com portal
    const clientesComPortal = clientes.filter(c => c.portalToken);
    return (
      <Modal title="Propor Aditivo ao Cliente" onClose={onClose}>
        <Field label="Cliente" hint="Apenas clientes com portal ativo">
          <select value={f.cliente} onChange={e=>setF(p=>({...p,cliente:e.target.value}))} style={selectStyle}>
            <option value="">Selecione...</option>
            {clientesComPortal.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <Field label="Descrição do Aditivo">
          <textarea rows={3} value={f.descricao} onChange={e=>setF(p=>({...p,descricao:e.target.value}))} style={{...inputStyle,resize:"vertical"}} placeholder="Ex: Inclusão de piso em porcelanato no quarto de hóspedes..."/>
        </Field>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>Enviar ao Cliente</button>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // PAGES
  // ══════════════════════════════════════════════════════════════

  // ── DASHBOARD ──
  const DashPage = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>Dashboard Executivo</h2>
          <p style={{fontSize:13,color:C.textDim,marginTop:4}}>Felt Engenharia · Abril 2026</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:4,background:C.green,animation:"pulse 2s ease infinite"}}/>
          <span style={{fontSize:11,color:C.textDim}}>Sync em tempo real</span>
        </div>
      </div>

      {/* ALERTAS */}
      {(cobsVencidas.length>0 || cobsEm7.length>0 || obrasRisco.length>0) && (
        <div style={{marginBottom:20,display:"grid",gap:10}}>
          {cobsVencidas.length>0 && (
            <div style={{background:C.red+"10",borderRadius:14,border:`1px solid ${C.red}33`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <p style={{fontSize:13,fontWeight:800,color:C.red}}>🚨 {cobsVencidas.length} cobranças vencidas — {R$(totalVencido)}</p>
                <p style={{fontSize:11,color:C.textMuted,marginTop:2}}>{cobsVencidas.map(c=>c.cliente).join(", ")}</p>
              </div>
              <button onClick={()=>setPage("faturamento")} style={{...btnGhost,borderColor:C.red+"44",color:C.red,fontSize:11}}>Ver detalhes →</button>
            </div>
          )}
          {cobsEm7.length>0 && (
            <div style={{background:C.amber+"10",borderRadius:14,border:`1px solid ${C.amber}33`,padding:"14px 20px"}}>
              <p style={{fontSize:13,fontWeight:800,color:C.amber}}>⏰ {cobsEm7.length} cobranças vencem nos próximos 7 dias — {R$(cobsEm7.reduce((s,c)=>s+(c.valor||0),0))}</p>
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                {cobsEm7.map(c=>(
                  <span key={c.id} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:C.amber+"18",color:C.amber}}>{c.cliente} · {R$(c.valor)} · {fmtD(c.data)}</span>
                ))}
              </div>
            </div>
          )}
          {obrasRisco.length>0 && (
            <div style={{background:C.purple+"10",borderRadius:14,border:`1px solid ${C.purple}33`,padding:"14px 20px"}}>
              <p style={{fontSize:13,fontWeight:800,color:C.purple}}>⚠️ {obrasRisco.length} obras com risco de estouro de custo</p>
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                {obrasRisco.map(o=>(
                  <span key={o.id} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:C.purple+"18",color:C.purple}}>{o.nome} — {pct(o.execucao)} gasto, margem {pct(o.margem)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs GERAIS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
        <MetricCard label="Faturamento Total" value={R$(faturamento)} color={C.accent} sub={`${obras.length} obras ativas`}/>
        <MetricCard label="Custo Geral" value={R$(custoGeral)} color={C.amber} sub={pct(faturamento>0?custoGeral/faturamento:0) + " do faturamento"}/>
        <MetricCard label="Lucro Geral" value={R$(lucroGeral)} color={lucroGeral>=0?C.green:C.red} sub={"Margem: " + pct(margemGeral)}/>
        <MetricCard label="Recebido (2026)" value={R$(totalRecebido)} color={C.cyan} sub={cobs.filter(c=>c.status==="RECEBIDO").length + " pagamentos"}/>
        <MetricCard label="Próximos 30d" value={R$(prox30Total)} color={C.purple} sub={prox30.length + " cobranças"}/>
        <MetricCard label="Burn Rate" value={R$(burnRate)} color={C.red} sub="Média despesa/mês"/>
      </div>

      {/* FLUXO DE CAIXA */}
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2}}>Fluxo de Caixa Mensal</p>
            <p style={{fontSize:18,fontWeight:800,color:C.gold,marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>Saldo acumulado: {R$(saldoAcum)}</p>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${fluxoData.length},1fr)`,gap:10}}>
          {fluxoData.map(f=>(
            <div key={f.m} style={{background:C.bg,borderRadius:12,padding:"16px 18px",border:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>{f.label}</p>
              <p style={{fontSize:18,fontWeight:800,color:f.saldo>=0?C.green:C.red,marginTop:6,fontFamily:"'JetBrains Mono',monospace"}}>{R$(f.saldo)}</p>
              <div style={{marginTop:8,fontSize:10,color:C.textMuted}}>
                <span>↑ {R$(f.rec)}</span>
                <span style={{marginLeft:12}}>↓ {R$(f.desp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP OBRAS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:16}}>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Rentabilidade por Obra</p>
          <div style={{display:"grid",gap:10}}>
            {obraKPIs.map(o=>(
              <div key={o.id} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:8,height:8,borderRadius:4,background:o.color}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <p style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.nome}</p>
                    <p style={{fontSize:12,fontWeight:700,color:o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{pct(o.margem)}</p>
                  </div>
                  <ProgressBar value={o.execucao} max={1} color={o.color} height={5}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Distribuição de Recebimentos</p>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <Donut segments={[
              {value:totalRecebido,color:C.green},
              {value:totalAVencer,color:C.cyan},
              {value:totalProximo,color:C.amber},
              {value:totalVencido,color:C.red}
            ]} label="Total"/>
            <div style={{flex:1}}>
              {[
                {label:"Recebido",val:totalRecebido,color:C.green},
                {label:"A Vencer",val:totalAVencer,color:C.cyan},
                {label:"Próximo",val:totalProximo,color:C.amber},
                {label:"Vencido",val:totalVencido,color:C.red}
              ].map(s=>(
                <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:4,background:s.color}}/>
                    <span style={{fontSize:11,color:C.textMuted}}>{s.label}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(s.val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── OBRAS ──
  const ObrasPage = () => {
    if (selObra) {
      const o = obraKPIs.find(x => x.id === selObra);
      if (!o) { setSelObra(null); return null; }
      const ls = obraLancs(o.id).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
      const ccBreak = {};
      ls.forEach(l => { ccBreak[l.centroCusto] = (ccBreak[l.centroCusto]||0) + (l.valor||0); });
      const recebido = obraRecebido(o.id);
      return (
        <div>
          <button onClick={()=>setSelObra(null)} style={{...btnGhost,marginBottom:16}}>← Voltar</button>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
            <div>
              <h2 style={{fontSize:26,fontWeight:900,letterSpacing:-1}}>{o.nome}</h2>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                <Badge text={o.status} color={o.status==="Em andamento"?C.green:C.textMuted}/>
                {o.semDadosReais && <Badge text="AGUARDANDO INÍCIO" color={C.amber}/>}
              </div>
            </div>
            {isAdmin && (
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setModal({type:"obraEdit",obra:o})} style={btnGhost}>✏️ Editar</button>
                <button onClick={()=>setModal({type:"lancForm",tipo:"obra"})} style={btnPrimary}>＋ Lançamento</button>
              </div>
            )}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
            <MetricCard small label="Contrato" value={R$(o.contrato)} color={C.accent}/>
            <MetricCard small label="Custo Total" value={R$(o.custo)} color={C.amber} sub={`Direto: ${R$(o.custoDireto)}`}/>
            <MetricCard small label="Lucro Bruto" value={R$(o.lucroBruto)} color={o.lucroBruto>=0?C.green:C.red}/>
            <MetricCard small label="Margem" value={pct(o.margem)} color={o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red}/>
            <MetricCard small label="Execução" value={pct(o.execucao)} color={o.execucao>0.8?C.red:o.execucao>0.6?C.amber:C.green}/>
            <MetricCard small label="Já Recebido" value={R$(recebido)} color={C.cyan}/>
          </div>

          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
            <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Custo por Centro</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {Object.entries(ccBreak).sort((a,b)=>b[1]-a[1]).map(([cc,val],i)=>(
                <div key={cc} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}>
                  <div style={{width:8,height:8,borderRadius:4,background:palette[i%palette.length]}}/>
                  <span style={{fontSize:11,color:C.textMuted}}>{cc}</span>
                  <span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(val)}</span>
                </div>
              ))}
              {diariasCustoObra(o.id) > 0 && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.cyan}44`}}>
                  <div style={{width:8,height:8,borderRadius:4,background:C.cyan}}/>
                  <span style={{fontSize:11,color:C.cyan}}>EQUIPE (diárias)</span>
                  <span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(diariasCustoObra(o.id))}</span>
                </div>
              )}
              {mensalistaCustoObra(o.id) > 0 && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.purple}44`}}>
                  <div style={{width:8,height:8,borderRadius:4,background:C.purple}}/>
                  <span style={{fontSize:11,color:C.purple}}>RATEIO MENSALISTAS ({numMeses}m)</span>
                  <span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(mensalistaCustoObra(o.id))}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <TH>Data</TH><TH>Descrição</TH><TH>C.Custo</TH><TH align="right">Valor</TH><TH>Obs</TH>
                  {isAdmin && <TH></TH>}
                </tr></thead>
                <tbody>
                  {ls.map(l=>(
                    <tr key={l.id}>
                      <TD>{fmtD(l.data)}</TD>
                      <TD bold>{l.descricao}</TD>
                      <TD><Badge text={l.centroCusto} color={C.purple} size="sm"/></TD>
                      <TD mono bold align="right">{R$(l.valor)}</TD>
                      <TD color={C.textDim}>{l.obs||"—"}</TD>
                      {isAdmin && (
                        <TD>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>setModal({type:"lancEdit",lanc:l,tipo:"obra"})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button>
                            <button onClick={()=>fbDelLanc(l.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>
                          </div>
                        </TD>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>🏗️ Obras</h2>
          {isAdmin && <button onClick={()=>setModal({type:"obraForm"})} style={btnPrimary}>＋ Nova Obra</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
          {obraKPIs.map(o=>{
            const sc = o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red;
            return (
              <div key={o.id} onClick={()=>setSelObra(o.id)} style={{
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px 26px",
                cursor: "pointer",
                borderTop: `3px solid ${o.color}`,
                transition: "all 0.2s"
              }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=o.color+"55";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=C.border;}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <p style={{fontSize:15,fontWeight:800,letterSpacing:-0.3}}>{o.nome}</p>
                  {o.semDadosReais ? <Badge text="AGUARDANDO" color={C.amber} size="sm"/> : <Badge text={o.status} color={o.status==="Em andamento"?C.green:C.textMuted} size="sm"/>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12,marginBottom:14}}>
                  <div>
                    <span style={{color:C.textDim,fontSize:10}}>CONTRATO</span>
                    <p style={{fontWeight:700,fontSize:14,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.contrato)}</p>
                  </div>
                  <div>
                    <span style={{color:C.textDim,fontSize:10}}>CUSTO</span>
                    <p style={{fontWeight:700,fontSize:14,marginTop:2,color:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.custo)}</p>
                  </div>
                  <div>
                    <span style={{color:C.textDim,fontSize:10}}>LUCRO</span>
                    <p style={{fontWeight:700,fontSize:14,marginTop:2,color:o.lucroBruto>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.lucroBruto)}</p>
                  </div>
                  <div>
                    <span style={{color:C.textDim,fontSize:10}}>MARGEM</span>
                    <p style={{fontWeight:700,fontSize:14,marginTop:2,color:sc}}>{pct(o.margem)}</p>
                  </div>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:10,color:C.textDim}}>EXECUÇÃO</span>
                    <span style={{fontSize:10,color:C.textMuted,fontWeight:700}}>{pct(o.execucao)}</span>
                  </div>
                  <ProgressBar value={o.execucao} max={1} color={o.execucao>0.8?C.red:o.execucao>0.6?C.amber:o.color} height={5}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── EQUIPE — RECONSTRUÍDA COM INTEGRAÇÃO VISÍVEL DE CUSTO POR OBRA ──
  const EquipePage = () => {
    const [eqTab,setEqTab] = useState("visao");
    const [eqFiltroMes,setEqFiltroMes] = useState(new Date().toISOString().slice(0,7));
    const [eqObraAloc,setEqObraAloc] = useState(obrasAtivas[0]?.id || "");

    // Calcular custo por obra — visão por mês selecionado
    const custoEquipePorObra = obrasAtivas.map(o => {
      // diaristas do mês
      const custoDiaristas = diaristas.reduce((s,st)=>{
        const dias = diariasList.filter(d=>d.equipeId===st.id && d.obraId===o.id && d.data?.startsWith(eqFiltroMes)).length;
        return s + dias * (st.valorDiaria||0);
      }, 0);
      // rateio mensalista do mês
      const rateio = rateioPorObra;
      return { ...o, custoDiaristas, rateio, totalMes: custoDiaristas + rateio };
    });

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>👷 Equipe</h2>
            <p style={{fontSize:13,color:C.textDim,marginTop:4}}>{mensalistas.length} mensalistas · {diaristas.length} diaristas · Rateio em {obrasAtivas.length} obras ativas</p>
          </div>
          {isAdmin && (
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setModal({type:"staffForm"})} style={btnPrimary}>＋ Cadastrar</button>
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}>
          <MetricCard small label="Folha Mensalistas" value={R$(totalSalariosMensal)} color={C.accent} sub={`${mensalistas.length} funcionários`}/>
          <MetricCard small label="Rateio / Obra" value={R$(rateioPorObra)} color={C.purple} sub={`÷ ${obrasAtivas.length} obras ativas`}/>
          <MetricCard small label="Diárias (total)" value={R$(custoDiariasTotal)} color={C.cyan} sub={`${diariasList.length} dias lançados`}/>
          <MetricCard small label="Custo Acumulado" value={R$(custoFuncTotal + custoDiariasTotal)} color={C.amber} sub={`${numMeses} ${numMeses===1?"mês":"meses"} de atividade`}/>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
          {[
            {id:"visao",label:"👥 Equipe"},
            {id:"integracao",label:"🔗 Integração com Obras"},
            {id:"diarias",label:"📅 Diárias"}
          ].map(t=>(
            <button key={t.id} onClick={()=>setEqTab(t.id)} style={{
              padding:"9px 16px",borderRadius:10,
              border:`1px solid ${eqTab===t.id?C.accent+"66":C.border}`,
              background:eqTab===t.id?C.accentGlow:"transparent",
              color:eqTab===t.id?C.accent:C.textMuted,
              fontSize:12,fontWeight:eqTab===t.id?700:500,cursor:"pointer"
            }}>{t.label}</button>
          ))}
        </div>

        {/* TAB VISÃO */}
        {eqTab === "visao" && (
          <div>
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Mensalistas ({mensalistas.length})</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH>Nome</TH><TH>Função</TH><TH align="right">Salário</TH><TH align="right">Rateio/Obra</TH><TH align="right">Custo Acumulado</TH>
                    {isAdmin && <TH></TH>}
                  </tr></thead>
                  <tbody>
                    {mensalistas.map(s=>{
                      const porObra = obrasAtivas.length>0 ? (s.salario||0)/obrasAtivas.length : 0;
                      return (
                        <tr key={s.id}>
                          <TD bold>{s.nome}</TD>
                          <TD><Badge text={s.funcao} color={C.accent} size="sm"/></TD>
                          <TD mono bold align="right">{R$(s.salario)}</TD>
                          <TD mono align="right" color={C.purple}>{R$(porObra)}</TD>
                          <TD mono bold align="right" color={C.amber}>{R$((s.salario||0) * numMeses)}</TD>
                          {isAdmin && (
                            <TD>
                              <div style={{display:"flex",gap:4}}>
                                <button onClick={()=>setModal({type:"staffEdit",staff:s})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button>
                                <button onClick={()=>fbDelStaff(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>
                              </div>
                            </TD>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Diaristas ({diaristas.length})</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH>Nome</TH><TH>Função</TH><TH align="right">Valor Diária</TH><TH align="right">Dias Totais</TH><TH align="right">Custo Total</TH>
                    {isAdmin && <TH></TH>}
                  </tr></thead>
                  <tbody>
                    {diaristas.map(s=>{
                      const dias = diariasList.filter(d=>d.equipeId===s.id).length;
                      return (
                        <tr key={s.id}>
                          <TD bold>{s.nome}</TD>
                          <TD><Badge text={s.funcao} color={C.cyan} size="sm"/></TD>
                          <TD mono bold align="right">{R$(s.valorDiaria)}</TD>
                          <TD mono align="right">{dias}</TD>
                          <TD mono bold align="right" color={C.amber}>{R$(dias * (s.valorDiaria||0))}</TD>
                          {isAdmin && (
                            <TD>
                              <div style={{display:"flex",gap:4}}>
                                <button onClick={()=>setModal({type:"staffEdit",staff:s})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button>
                                <button onClick={()=>fbDelStaff(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>
                              </div>
                            </TD>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB INTEGRAÇÃO — mostra como o custo da equipe se integra nas obras */}
        {eqTab === "integracao" && (
          <div>
            <div style={{background:C.purple+"0c",borderRadius:14,border:`1px solid ${C.purple}33`,padding:"14px 20px",marginBottom:16}}>
              <p style={{fontSize:12,fontWeight:700,color:C.purple,marginBottom:6}}>💡 Como funciona o rateio de mensalistas</p>
              <p style={{fontSize:11,color:C.textMuted,lineHeight:1.6}}>A folha mensal de mensalistas ({R$(totalSalariosMensal)}) é dividida igualmente entre as {obrasAtivas.length} obras em andamento, gerando um custo de {R$(rateioPorObra)} por obra por mês. O rateio é aplicado automaticamente em KPIs e custos totais da obra.</p>
            </div>

            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
                <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2}}>Custo Mensal de Equipe por Obra</p>
                <select value={eqFiltroMes} onChange={e=>setEqFiltroMes(e.target.value)} style={{...selectStyle,padding:"6px 12px",fontSize:12,width:160}}>
                  {["2026-01","2026-02","2026-03","2026-04"].map(m=><option key={m} value={m}>{MESES_ALL[parseInt(m.slice(5))-1]}/{m.slice(0,4)}</option>)}
                </select>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH>Obra</TH>
                    <TH align="right">Diaristas (mês)</TH>
                    <TH align="right">Rateio Mensalistas</TH>
                    <TH align="right">Total Mês</TH>
                    <TH align="right">% do Contrato</TH>
                  </tr></thead>
                  <tbody>
                    {custoEquipePorObra.map(o=>(
                      <tr key={o.id}>
                        <TD bold>{o.nome}</TD>
                        <TD mono align="right" color={C.cyan}>{R$(o.custoDiaristas)}</TD>
                        <TD mono align="right" color={C.purple}>{R$(o.rateio)}</TD>
                        <TD mono bold align="right" color={C.amber}>{R$(o.totalMes)}</TD>
                        <TD align="right">
                          <Badge text={o.contrato>0?pct(o.totalMes/o.contrato):"—"} color={C.accent} size="sm"/>
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:C.surfaceAlt}}>
                      <TD bold color={C.gold}>TOTAL</TD>
                      <TD mono bold align="right" color={C.cyan}>{R$(custoEquipePorObra.reduce((s,o)=>s+o.custoDiaristas,0))}</TD>
                      <TD mono bold align="right" color={C.purple}>{R$(custoEquipePorObra.reduce((s,o)=>s+o.rateio,0))}</TD>
                      <TD mono bold align="right" color={C.gold}>{R$(custoEquipePorObra.reduce((s,o)=>s+o.totalMes,0))}</TD>
                      <TD></TD>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB DIÁRIAS */}
        {eqTab === "diarias" && (
          <div>
            {isAdmin && (
              <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Registrar Diária</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
                  <div>
                    <label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Funcionário</label>
                    <select id="di-func" style={{...inputStyle,padding:"8px 12px",fontSize:12}}>
                      {diaristas.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Obra</label>
                    <select id="di-obra" style={{...inputStyle,padding:"8px 12px",fontSize:12}}>
                      {obrasAtivas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Data</label>
                    <input type="date" id="di-data" defaultValue={new Date().toISOString().slice(0,10)} style={{...inputStyle,padding:"8px 12px",fontSize:12}}/>
                  </div>
                  <button onClick={()=>{
                    const eqId = document.getElementById("di-func").value;
                    const oId = document.getElementById("di-obra").value;
                    const d = document.getElementById("di-data").value;
                    if (eqId && oId && d) fbAddDiaria({equipeId:eqId,obraId:oId,data:d});
                  }} style={{...btnPrimary,padding:"9px 16px",fontSize:12}}>＋ Registrar</button>
                </div>
              </div>
            )}

            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH>Data</TH><TH>Funcionário</TH><TH>Obra</TH><TH align="right">Valor Diária</TH>
                    {isAdmin && <TH></TH>}
                  </tr></thead>
                  <tbody>
                    {diariasList.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(d=>{
                      const s = staffList.find(x=>x.id===d.equipeId);
                      const o = obras.find(x=>x.id===d.obraId);
                      return (
                        <tr key={d.id}>
                          <TD>{fmtD(d.data)}</TD>
                          <TD bold>{s?.nome || "—"}</TD>
                          <TD color={C.textMuted}>{o?.nome || "—"}</TD>
                          <TD mono bold align="right">{R$(s?.valorDiaria||0)}</TD>
                          {isAdmin && (
                            <TD>
                              <button onClick={()=>fbDelDiaria(d.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>
                            </TD>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── LancPage (Operacional, Administrativo) ──
  const LancPage = ({tipo,titulo,emoji}) => {
    const ls = filterLancs(tipo);
    const total = ls.reduce((s,l)=>s+(l.valor||0), 0);
    const ccB = {};
    lancs.filter(l=>l.tipo===tipo).forEach(l=>{ ccB[l.centroCusto] = (ccB[l.centroCusto]||0) + (l.valor||0); });
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:10}}>
          <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>{emoji} {titulo}</h2>
          {isAdmin && <button onClick={()=>setModal({type:"lancForm",tipo})} style={btnPrimary}>＋ Lançamento</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:20}}>
          <MetricCard small label="Total" value={R$(total)} color={C.amber}/>
          <MetricCard small label="Lançamentos" value={ls.length + ""} color={C.accent}/>
          <MetricCard small label="Média" value={ls.length ? R$(total/ls.length) : "—"} color={C.purple}/>
        </div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Por Centro de Custo</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {Object.entries(ccB).sort((a,b)=>b[1]-a[1]).map(([cc,val],i)=>(
              <div key={cc} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}>
                <div style={{width:8,height:8,borderRadius:4,background:palette[i%palette.length]}}/>
                <span style={{fontSize:11,color:C.textMuted}}>{cc}</span>
                <span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(val)}</span>
              </div>
            ))}
          </div>
        </div>
        <select value={filterMes} onChange={e=>setFilterMes(e.target.value)} style={{...selectStyle,padding:"8px 12px",fontSize:12,marginBottom:12,width:200}}>
          <option value="todos">Todos os meses</option>
          {meses.map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}
        </select>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                <TH>#</TH><TH>Descrição</TH><TH align="right">Valor</TH><TH>Data</TH><TH>C.Custo</TH><TH>Obs</TH>
                {isAdmin && <TH></TH>}
              </tr></thead>
              <tbody>
                {ls.map((l,i)=>(
                  <tr key={l.id}>
                    <TD color={C.textDim}>{i+1}</TD>
                    <TD bold>{l.descricao}</TD>
                    <TD mono bold align="right">{R$(l.valor)}</TD>
                    <TD>{fmtD(l.data)}</TD>
                    <TD><Badge text={l.centroCusto} color={C.purple} size="sm"/></TD>
                    <TD color={C.textDim}>{l.obs||"—"}</TD>
                    {isAdmin && (
                      <TD>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>setModal({type:"lancEdit",lanc:l,tipo})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button>
                          <button onClick={()=>fbDelLanc(l.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>
                        </div>
                      </TD>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── HISTÓRICO ──
  const HistoricoPage = () => (
    <div>
      <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1,marginBottom:24}}>📝 Histórico de Atividades</h2>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
        {auditLogs.length === 0 ? (
          <p style={{color:C.textDim,fontSize:13,textAlign:"center",padding:"40px 0"}}>Nenhum registro de atividade ainda</p>
        ) : auditLogs.map(a=>(
          <div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${C.border}44`}}>
            <div>
              <p style={{fontSize:13,fontWeight:700}}>{a.acao}</p>
              <p style={{fontSize:11,color:C.textDim,marginTop:2}}>{a.detalhe}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:11,color:C.textMuted,fontWeight:600}}>{a.usuario}</p>
              <p style={{fontSize:10,color:C.textDim,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{a.timestamp?.slice(0,19).replace("T"," ")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── FATURAMENTO RECONSTRUÍDA ──
  // Status funciona via fbStatusCob() corrigida: usa update() e findCobKey() robusto.
  const FatPage = () => {
    const [fTab,setFTab] = useState("visao");
    const [fFiltroStatus,setFFiltroStatus] = useState("todos");

    const cobsFiltered = fFiltroStatus === "todos" ? cobs : cobs.filter(c => c.status === fFiltroStatus);
    const cobsSort = [...cobsFiltered].sort((a,b)=>(a.data||"").localeCompare(b.data||""));

    // Agenda por mês 2026
    const agendaPorMes = {};
    cobs.forEach(c=>{
      const m = c.data?.slice(0,7);
      if (!m || !m.startsWith("2026")) return;
      if (!agendaPorMes[m]) agendaPorMes[m] = { recebido:0, aReceber:0, itens:[] };
      if (c.status === "RECEBIDO") agendaPorMes[m].recebido += c.valor||0;
      else agendaPorMes[m].aReceber += c.valor||0;
      agendaPorMes[m].itens.push(c);
    });
    const mesesOrdenados = Object.keys(agendaPorMes).sort();

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>💰 Faturamento</h2>
            <p style={{fontSize:13,color:C.textDim,marginTop:4}}>Portfólio {R$(portfolioTotal)} · {clientes.length} contratos</p>
          </div>
          {isAdmin && (
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>setModal({type:"cobForm"})} style={btnPrimary}>＋ Cobrança</button>
              <button onClick={()=>setModal({type:"nfForm"})} style={btnGhost}>＋ NF</button>
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
          <MetricCard small label="Portfólio Total" value={R$(portfolioTotal)} color={C.accent}/>
          <MetricCard small label="Já Recebido" value={R$(portfolioRecebido)} color={C.green} sub={pct(portfolioTotal>0?portfolioRecebido/portfolioTotal:0)}/>
          <MetricCard small label="A Receber" value={R$(portfolioAReceber)} color={C.cyan}/>
          <MetricCard small label="Próximos 30d" value={R$(prox30Total)} color={C.amber} sub={prox30.length + " cobranças"}/>
          <MetricCard small label="Vencido" value={R$(totalVencido)} color={C.red} sub={cobsVencidas.length + " pendências"}/>
          <MetricCard small label="NFs Emitidas" value={R$(nfsList.reduce((s,n)=>s+(n.valor||0),0))} color={C.purple} sub={nfsList.length + " NFs"}/>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
          {[
            {id:"visao",label:"📊 Visão Geral"},
            {id:"cronograma",label:"📋 Cronograma de Cobranças"},
            {id:"agenda",label:"📅 Agenda por Mês"},
            {id:"portfolio",label:"💼 Portfólio de Clientes"},
            {id:"nfs",label:"🧾 NFs"}
          ].map(t=>(
            <button key={t.id} onClick={()=>setFTab(t.id)} style={{
              padding:"9px 16px",borderRadius:10,
              border:`1px solid ${fTab===t.id?C.accent+"66":C.border}`,
              background:fTab===t.id?C.accentGlow:"transparent",
              color:fTab===t.id?C.accent:C.textMuted,
              fontSize:12,fontWeight:fTab===t.id?700:500,cursor:"pointer"
            }}>{t.label}</button>
          ))}
        </div>

        {fTab === "visao" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:16}}>
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Distribuição de Recebimentos</p>
              <div style={{display:"flex",alignItems:"center",gap:20}}>
                <Donut segments={[
                  {value:totalRecebido,color:C.green},
                  {value:totalAVencer,color:C.cyan},
                  {value:totalProximo,color:C.amber},
                  {value:totalVencido,color:C.red}
                ]}/>
                <div style={{flex:1}}>
                  {[
                    {label:"Recebido",val:totalRecebido,color:C.green,n:cobs.filter(c=>c.status==="RECEBIDO").length},
                    {label:"A Vencer",val:totalAVencer,color:C.cyan,n:cobs.filter(c=>c.status==="A VENCER").length},
                    {label:"Próximo",val:totalProximo,color:C.amber,n:cobs.filter(c=>c.status==="PROXIMO").length},
                    {label:"Vencido",val:totalVencido,color:C.red,n:cobs.filter(c=>c.status==="VENCIDO").length}
                  ].map(s=>(
                    <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:8,height:8,borderRadius:4,background:s.color}}/>
                        <span style={{fontSize:11,color:C.textMuted}}>{s.label} ({s.n})</span>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(s.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Próximas Cobranças (30d)</p>
              {prox30.slice(0,8).map(c=>(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}44`}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:700}}>{c.cliente}</p>
                    <p style={{fontSize:11,color:C.textDim,marginTop:2}}>{fmtD(c.data)} · {c.obs||"—"}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:14,fontWeight:800,color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{R$(c.valor)}</p>
                    <Badge text={c.status} color={FAT_STATUS_COLOR[c.status]} size="sm"/>
                  </div>
                </div>
              ))}
              {prox30.length === 0 && <p style={{color:C.textDim,fontSize:12,textAlign:"center",padding:"20px 0"}}>Nenhuma cobrança nos próximos 30 dias</p>}
            </div>
          </div>
        )}

        {fTab === "cronograma" && (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <button onClick={()=>setFFiltroStatus("todos")} style={{...btnGhost,borderColor:fFiltroStatus==="todos"?C.accent:C.border,color:fFiltroStatus==="todos"?C.accent:C.textMuted}}>Todas ({cobs.length})</button>
              {FAT_STATUS.map(s=>(
                <button key={s} onClick={()=>setFFiltroStatus(s)} style={{...btnGhost,borderColor:fFiltroStatus===s?FAT_STATUS_COLOR[s]:C.border,color:fFiltroStatus===s?FAT_STATUS_COLOR[s]:C.textMuted}}>{s} ({cobs.filter(c=>c.status===s).length})</button>
              ))}
            </div>

            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH>Data</TH><TH>Cliente</TH><TH align="right">Valor</TH><TH>Status</TH><TH>Obs</TH>
                    {isAdmin && <TH></TH>}
                  </tr></thead>
                  <tbody>
                    {cobsSort.map(c=>(
                      <tr key={c.id}>
                        <TD>{fmtD(c.data)}</TD>
                        <TD bold>{c.cliente}</TD>
                        <TD mono bold align="right">{R$(c.valor)}</TD>
                        <TD><Badge text={c.status} color={FAT_STATUS_COLOR[c.status]||C.textMuted}/></TD>
                        <TD color={C.textDim}>{c.obs||"—"}</TD>
                        {isAdmin && (
                          <TD>
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              {c.status !== "RECEBIDO" && (
                                <button onClick={()=>fbStatusCob(c.id,"RECEBIDO")} style={{
                                  background: C.green+"15",
                                  color: C.green,
                                  border: `1px solid ${C.green}44`,
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}>✓ Marcar Recebido</button>
                              )}
                              <button onClick={()=>setModal({type:"cobEdit",cob:c})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button>
                              <button onClick={()=>fbDelCob(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>
                            </div>
                          </TD>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:C.surfaceAlt}}>
                      <TD></TD>
                      <TD bold color={C.gold}>TOTAL</TD>
                      <TD mono bold align="right" color={C.gold}>{R$(cobsSort.reduce((s,c)=>s+(c.valor||0),0))}</TD>
                      <TD></TD><TD></TD>{isAdmin && <TD></TD>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {fTab === "agenda" && (
          <div style={{display:"grid",gap:14}}>
            {mesesOrdenados.map(m=>{
              const mi = agendaPorMes[m];
              const mes = MESES_ALL[parseInt(m.slice(5))-1];
              return (
                <div key={m} style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
                    <p style={{fontSize:16,fontWeight:800,letterSpacing:-0.3}}>{mes} {m.slice(0,4)}</p>
                    <div style={{display:"flex",gap:12}}>
                      <span style={{fontSize:12}}><span style={{color:C.textDim}}>Recebido:</span> <b style={{color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>{R$(mi.recebido)}</b></span>
                      <span style={{fontSize:12}}><span style={{color:C.textDim}}>A Receber:</span> <b style={{color:C.cyan,fontFamily:"'JetBrains Mono',monospace"}}>{R$(mi.aReceber)}</b></span>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
                    {mi.itens.sort((a,b)=>(a.data||"").localeCompare(b.data||"")).map(c=>(
                      <div key={c.id} style={{background:C.bg,borderRadius:10,padding:"10px 14px",border:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:11,fontWeight:700,color:C.textMuted}}>{fmtD(c.data)}</span>
                          <Badge text={c.status} color={FAT_STATUS_COLOR[c.status]||C.textMuted} size="sm"/>
                        </div>
                        <p style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cliente}</p>
                        <p style={{fontSize:14,fontWeight:800,color:C.gold,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{R$(c.valor)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {fTab === "portfolio" && (
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <TH>Cliente</TH><TH align="center">Ano</TH><TH align="right">Contrato</TH><TH align="right">Pago</TH><TH align="right">Saldo</TH><TH>Status</TH><TH>Portal</TH>
                </tr></thead>
                <tbody>
                  {clientesSorted.map(c=>{
                    const recCob = cobs.filter(x=>x.cliente===c.nome && x.status==="RECEBIDO").reduce((s,x)=>s+(x.valor||0),0);
                    const totalPago = (c.pagoPre||0) + recCob;
                    const saldo = (c.contrato||0) - totalPago;
                    return (
                      <tr key={c.id}>
                        <TD bold>{c.nome}</TD>
                        <TD align="center" color={C.textDim}>{c.ano}</TD>
                        <TD mono bold align="right">{R$(c.contrato)}</TD>
                        <TD mono align="right" color={C.green}>{R$(totalPago)}</TD>
                        <TD mono align="right" color={saldo>0?C.cyan:C.textDim}>{R$(saldo)}</TD>
                        <TD><Badge text={c.status} color={c.status==="QUITADO"?C.green:c.status==="EM ATRASO"?C.red:C.cyan} size="sm"/></TD>
                        <TD>{c.portalToken ? <Badge text="✓ ATIVO" color={C.gold} size="sm"/> : <span style={{fontSize:11,color:C.textDim}}>—</span>}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {fTab === "nfs" && (
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <TH>Data</TH><TH>Cliente</TH><TH align="right">Valor</TH>
                  {isAdmin && <TH></TH>}
                </tr></thead>
                <tbody>
                  {nfsList.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(n=>(
                    <tr key={n.id}>
                      <TD>{fmtD(n.data)}</TD>
                      <TD bold>{n.cliente}</TD>
                      <TD mono bold align="right">{R$(n.valor)}</TD>
                      {isAdmin && <TD><button onClick={()=>fbDelNf(n.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></TD>}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:C.surfaceAlt}}>
                    <TD bold color={C.gold}>TOTAL</TD>
                    <TD></TD>
                    <TD mono bold align="right" color={C.gold}>{R$(nfsList.reduce((s,n)=>s+(n.valor||0),0))}</TD>
                    {isAdmin && <TD></TD>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── NfForm (inline aqui pois só é usado pela FatPage) ──
  const NfForm = ({onClose}) => {
    const [f,setF] = useState({ data: new Date().toISOString().slice(0,10), cliente:"", valor:"" });
    const doSave = () => {
      if (!f.cliente || !f.valor) return;
      fbAddNf({...f,valor:parseFloat(f.valor)});
      onClose();
    };
    return (
      <Modal title="Nova NF" onClose={onClose}>
        <Field label="Cliente">
          <input value={f.cliente} onChange={e=>setF(p=>({...p,cliente:e.target.value}))} style={inputStyle}/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>Registrar NF</button>
      </Modal>
    );
  };

  // ── KPIs RECONSTRUÍDA ──
  // Corrige o bug de obras sem dados lançados aparecerem com margem 100%.
  const KPIsPage = () => {
    // Matriz CC × Obra
    const allCCs = [...new Set(lancs.filter(l=>l.tipo==="obra").map(l=>l.centroCusto))].sort();
    return (
      <div>
        <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1,marginBottom:24}}>🎯 KPIs Avançados</h2>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:20}}>
          <MetricCard small label="Inadimplência" value={pct(inadimplencia)} color={inadimplencia>0.15?C.red:inadimplencia>0.05?C.amber:C.green} sub={R$(totalVencido) + " em atraso"}/>
          <MetricCard small label="Concentração TOP 3" value={pct(concentracao)} color={concentracao>0.4?C.red:concentracao>0.25?C.amber:C.green} sub={"de " + clientes.length + " clientes"}/>
          <MetricCard small label="Obras em Risco" value={obrasRisco.length + ""} color={obrasRisco.length>0?C.red:C.green} sub="execução>60% + margem<20%"/>
          <MetricCard small label="Burn Rate" value={R$(burnRate)} color={C.amber} sub="média despesa/mês"/>
        </div>

        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:20}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Rentabilidade & Execução por Obra</p>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                <TH>Obra</TH><TH align="right">Contrato</TH><TH align="right">Custo Total</TH><TH align="right">Lucro</TH><TH align="right">Margem</TH><TH align="right">Execução</TH><TH align="right">ROI</TH><TH>Estado</TH>
              </tr></thead>
              <tbody>
                {obraKPIs.map(o=>(
                  <tr key={o.id} style={{opacity:o.semDadosReais?0.6:1}}>
                    <TD bold>{o.nome}</TD>
                    <TD mono align="right">{R$(o.contrato)}</TD>
                    <TD mono align="right" color={C.amber}>{R$(o.custo)}</TD>
                    <TD mono bold align="right" color={o.lucroBruto>=0?C.green:C.red}>{R$(o.lucroBruto)}</TD>
                    <TD mono bold align="right" color={o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red}>
                      {o.semDadosReais ? "—" : pct(o.margem)}
                    </TD>
                    <TD mono align="right" color={o.execucao>0.8?C.red:o.execucao>0.6?C.amber:C.text}>{pct(o.execucao)}</TD>
                    <TD mono align="right">{o.semDadosReais ? "—" : pct(o.roi)}</TD>
                    <TD>
                      {o.semDadosReais ? <Badge text="AGUARDANDO" color={C.amber} size="sm"/> :
                       o.execucao>0.8 && o.margem<0.15 ? <Badge text="RISCO" color={C.red} size="sm"/> :
                       o.margem>=0.25 ? <Badge text="ÓTIMA" color={C.green} size="sm"/> :
                       <Badge text="NORMAL" color={C.cyan} size="sm"/>}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:20}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Matriz Centro de Custo × Obra</p>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                <TH>Centro</TH>
                {obras.map(o=><TH key={o.id} align="right"><span style={{fontSize:10}}>{o.nome.replace("OBRA ","")}</span></TH>)}
                <TH align="right">TOTAL</TH>
              </tr></thead>
              <tbody>
                {allCCs.map(cc=>{
                  const vals = obras.map(o=>obraLancs(o.id).filter(l=>l.centroCusto===cc).reduce((s,l)=>s+(l.valor||0),0));
                  const tot = vals.reduce((s,v)=>s+v,0);
                  if (tot === 0) return null;
                  return (
                    <tr key={cc}>
                      <TD><Badge text={cc} color={C.purple} size="sm"/></TD>
                      {vals.map((v,i)=><TD key={i} mono align="right" color={v>0?C.text:C.textDim}>{v>0?R$(v):"—"}</TD>)}
                      <TD mono bold align="right" color={C.gold}>{R$(tot)}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Proporção M.O. no Contrato</p>
          {moRatioObras.filter(o=>!o.semDadosReais).map(o=>(
            <div key={o.id} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:700}}>{o.nome}</span>
                <span style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.moVal)} · <b style={{color:o.moRatio>0.4?C.red:o.moRatio>0.3?C.amber:C.green}}>{pct(o.moRatio)}</b></span>
              </div>
              <ProgressBar value={o.moRatio} max={0.6} color={o.moRatio>0.4?C.red:o.moRatio>0.3?C.amber:C.green} height={6}/>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── PORTAIS DOS CLIENTES (admin) ──
  const PortaisPage = () => {
    const clientesComPortal = clientes.filter(c => c.portalToken);
    const [copied,setCopied] = useState(null);
    const copyLink = (token,id) => {
      const link = `${window.location.origin}${window.location.pathname}?portal=${token}`;
      navigator.clipboard.writeText(link);
      setCopied(id);
      showToast("Link copiado!");
      setTimeout(()=>setCopied(null),1500);
    };

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>🔑 Portais dos Clientes</h2>
            <p style={{fontSize:13,color:C.textDim,marginTop:4}}>{clientesComPortal.length} clientes com portal ativo · {aditivos.length} aditivos no sistema</p>
          </div>
          <button onClick={()=>setModal({type:"aditivoForm"})} style={btnPrimary}>＋ Propor Aditivo</button>
        </div>

        <div style={{background:C.gold+"08",borderRadius:14,border:`1px solid ${C.gold}33`,padding:"14px 20px",marginBottom:20}}>
          <p style={{fontSize:12,fontWeight:700,color:C.gold,marginBottom:6}}>🎁 Como funciona o portal</p>
          <p style={{fontSize:11,color:C.textMuted,lineHeight:1.6}}>Cada cliente recebe um link exclusivo que dá acesso completo à sua obra: cronograma de pagamentos, timeline de eventos, custos aplicados, NFs emitidas e aditivos para aprovação. O portal é acessado via <code style={{background:C.bg,padding:"2px 6px",borderRadius:4,color:C.gold}}>{window.location.origin}{window.location.pathname}?portal=TOKEN</code></p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14,marginBottom:24}}>
          {clientesComPortal.map(c=>{
            const ads = aditivos.filter(a=>a.cliente===c.nome);
            const adsPend = ads.filter(a=>a.status==="pendente").length;
            return (
              <div key={c.id} style={{
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "20px 22px",
                borderTop: `3px solid ${C.gold}`
              }}>
                <p style={{fontSize:15,fontWeight:800,letterSpacing:-0.3,marginBottom:8}}>{c.nome}</p>
                <p style={{fontSize:11,color:C.textDim,marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>Token: {c.portalToken}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <div>
                    <span style={{fontSize:10,color:C.textDim}}>CONTRATO</span>
                    <p style={{fontWeight:700,fontSize:13,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{R$(c.contrato)}</p>
                  </div>
                  <div>
                    <span style={{fontSize:10,color:C.textDim}}>ADITIVOS</span>
                    <p style={{fontWeight:700,fontSize:13,marginTop:2}}>{ads.length} {adsPend>0 && <span style={{color:C.amber,fontSize:10}}>({adsPend} pend.)</span>}</p>
                  </div>
                </div>
                <button onClick={()=>copyLink(c.portalToken,c.id)} style={{
                  ...btnGhost,
                  width:"100%",
                  justifyContent:"center",
                  borderColor: copied===c.id ? C.green : C.gold+"44",
                  color: copied===c.id ? C.green : C.gold
                }}>{copied===c.id ? "✓ Copiado!" : "📋 Copiar link do portal"}</button>
              </div>
            );
          })}
        </div>

        {aditivos.length > 0 && (
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2}}>Aditivos Registrados</p>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <TH>Data</TH><TH>Cliente</TH><TH>Descrição</TH><TH align="right">Valor</TH><TH>Status</TH>
                </tr></thead>
                <tbody>
                  {aditivos.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(a=>(
                    <tr key={a.id}>
                      <TD>{fmtD(a.data)}</TD>
                      <TD bold>{a.cliente}</TD>
                      <TD color={C.textMuted}>{a.descricao}</TD>
                      <TD mono bold align="right">{R$(a.valor)}</TD>
                      <TD><Badge text={a.status} color={a.status==="aprovado"?C.green:a.status==="recusado"?C.red:C.amber} size="sm"/></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER PAGE SWITCH
  // ══════════════════════════════════════════════════════════════
  const renderPage = () => {
    switch(page) {
      case "dashboard": return <DashPage/>;
      case "obras": return <ObrasPage/>;
      case "faturamento": return <FatPage/>;
      case "funcionarios": return <EquipePage/>;
      case "operacional": return <LancPage tipo="operacional" titulo="Operacional" emoji="⛽"/>;
      case "administrativo": return <LancPage tipo="administrativo" titulo="Administrativo" emoji="💼"/>;
      case "kpis": return <KPIsPage/>;
      case "portais": return <PortaisPage/>;
      case "historico": return <HistoricoPage/>;
      default: return <DashPage/>;
    }
  };

  // ══════════════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'SF Pro Display','Inter',system-ui,sans-serif"}}>

      {/* SIDEBAR */}
      <aside style={{
        width: sideCollapsed ? 72 : 248,
        background: `linear-gradient(180deg,${C.surface},${C.surfaceAlt})`,
        borderRight: `1px solid ${C.border}`,
        padding: "24px 14px",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,padding:"0 6px"}}>
          <div style={{
            width:38,height:38,borderRadius:10,
            background:`linear-gradient(135deg,${C.navy},${C.navyLight})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:14,fontWeight:900,color:C.gold,letterSpacing:-1,
            border:`1px solid ${C.gold}44`,
            flexShrink:0
          }}>FE</div>
          {!sideCollapsed && (
            <div>
              <p style={{fontSize:13,fontWeight:800,letterSpacing:-0.3}}>Felt</p>
              <p style={{fontSize:9,color:C.textDim,letterSpacing:1,textTransform:"uppercase"}}>Engenharia</p>
            </div>
          )}
        </div>

        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:3}}>
          {visibleNav.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: sideCollapsed ? "11px 0" : "11px 14px",
              borderRadius: 10,
              border: "none",
              background: page===item.id ? C.accentGlow : "transparent",
              color: page===item.id ? C.accent : C.textMuted,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: page===item.id ? 700 : 500,
              textAlign: "left",
              transition: "all 0.2s",
              justifyContent: sideCollapsed ? "center" : "flex-start",
              borderLeft: page===item.id && !sideCollapsed ? `3px solid ${C.accent}` : "3px solid transparent"
            }} onMouseEnter={e=>{if(page!==item.id) e.currentTarget.style.color=C.text;}} onMouseLeave={e=>{if(page!==item.id) e.currentTarget.style.color=C.textMuted;}}>
              <span style={{fontSize:15}}>{item.emoji}</span>
              {!sideCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{paddingTop:16,borderTop:`1px solid ${C.border}`}}>
          {!sideCollapsed ? (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px"}}>
              <div style={{
                width:34,height:34,borderRadius:10,
                background:`linear-gradient(135deg,${C.gold},${C.accentDark})`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:900,color:"#000"
              }}>{user.avatar}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.nome}</p>
                <p style={{fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:0.8}}>{user.role}</p>
              </div>
              <button onClick={()=>setUser(null)} title="Sair" style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:16,padding:6}}>↗</button>
            </div>
          ) : (
            <button onClick={()=>setUser(null)} title="Sair" style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:16,padding:"10px 0",width:"100%"}}>↗</button>
          )}
          <button onClick={()=>setSideCollapsed(!sideCollapsed)} style={{
            width:"100%",
            background:"none",
            border:`1px solid ${C.border}`,
            color:C.textDim,
            padding:"6px 0",
            borderRadius:8,
            cursor:"pointer",
            fontSize:14,
            marginTop:8
          }}>{sideCollapsed ? "→" : "←"}</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,padding:"36px 44px",overflow:"auto",minWidth:0}}>
        {renderPage()}
      </main>

      {/* MODALS */}
      {modal?.type === "lancForm" && <LancForm tipo={modal.tipo} onClose={()=>setModal(null)}/>}
      {modal?.type === "lancEdit" && <LancForm initial={modal.lanc} tipo={modal.tipo} onClose={()=>setModal(null)}/>}
      {modal?.type === "obraForm" && <ObraForm onClose={()=>setModal(null)}/>}
      {modal?.type === "obraEdit" && <ObraForm initial={modal.obra} onClose={()=>setModal(null)}/>}
      {modal?.type === "cobForm" && <CobForm onClose={()=>setModal(null)}/>}
      {modal?.type === "cobEdit" && <CobForm initial={modal.cob} onClose={()=>setModal(null)}/>}
      {modal?.type === "nfForm" && <NfForm onClose={()=>setModal(null)}/>}
      {modal?.type === "staffForm" && <StaffForm onClose={()=>setModal(null)}/>}
      {modal?.type === "staffEdit" && <StaffForm initial={modal.staff} onClose={()=>setModal(null)}/>}
      {modal?.type === "aditivoForm" && <AditivoForm onClose={()=>setModal(null)}/>}

      {/* TOAST */}
      {toast && (
        <div style={{
          position:"fixed",
          bottom:30,
          right:30,
          background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,
          border:`1px solid ${C.gold}44`,
          color:C.text,
          padding:"14px 22px",
          borderRadius:12,
          fontSize:13,
          fontWeight:600,
          boxShadow:`0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${C.gold}22`,
          zIndex:300,
          animation:"slideUp 0.3s ease"
        }}>{toast}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CSS GLOBAL + MOUNT
// ══════════════════════════════════════════════════════════════
if (!document.getElementById("felt-erp-global-css")) {
  const style = document.createElement("style");
  style.id = "felt-erp-global-css";
  style.textContent = `
    * { box-sizing: border-box; }
    body, html { margin:0; padding:0; background:#060b14; color:#edf0f7; font-family:'SF Pro Display','Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #060b14; }
    ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #2a3d65; }
    input:focus, select:focus, textarea:focus { border-color: #c9a84c !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important; }
    button:hover { filter: brightness(1.08); }
    table { font-variant-numeric: tabular-nums; }
  `;
  document.head.appendChild(style);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
