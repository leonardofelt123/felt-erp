import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom/client";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
let storage = null;
try { storage = getStorage(app); console.log("Firebase Storage OK"); } catch(e) { console.warn("Storage indisponível:", e.message); }


// ─── CONSTANTS ───
const CC_OBRA_DEFAULT = ["MATERIAL","ADMINISTRATIVO","MÃO DE OBRA","SERVIÇOS TERCEIROS","TRANSPORTE/FRETES","IMPOSTO","RT","MARCENARIA","VIDRAÇARIA","SERRALHERIA","PINTURA","ELÉTRICA","HIDRÁULICA","IMPERMEABILIZAÇÃO"];
const CC_FUNC = ["TIAGO","STEFANI","RAFAEL","FELIPE","ALLEF","MATEUS"];
const CC_ADM = ["CONTABILIDADE","ASSINATURAS","RDO","GARAGEM","INTERNET/TELEFONE","ALIMENTAÇÃO","TRÁFEGO PAGO","TERCEIROS","COMPRAS"];
const CC_OPER = ["COMBUSTÍVEL","PEDÁGIO","CAFÉ DA MANHÃ","ALIMENTAÇÃO EQUIPE","ESTACIONAMENTO","UBER/TRANSPORTE","OUTROS"];
const FUNCOES = ["PEDREIRO","AJUDANTE","ELETRICISTA","ENCANADOR","GESSEIRO","CERAMISTA","PINTOR","SERRALHEIRO","MARCENEIRO","TÉCNICO AR","SERVENTE","MESTRE DE OBRAS","OUTRO"];
const STATUS_OPTS = ["Em andamento","Concluída","Parada","Orçamento"];
const FAT_STATUS = ["RECEBIDO","A VENCER","PROXIMO","VENCIDO"];
const FAT_STATUS_COLOR = {RECEBIDO:"#34d399","A VENCER":"#22d3ee",PROXIMO:"#fbbf24",VENCIDO:"#f87171"};
const OBRA_CLIENTE_MAP = {
  "o1":["HL 227"],"o2":["LIVING DUETT","DUETT"],"o3":["EPICO 154","ANALICE"],
  "o4":["NAU KLABIN APT 1607","NAU 1607"],"o5":["LANDMARK APT 202","LANDMARK"]
};
const PORTAL_TOKENS = {
  "parkview-tanii":"PARK VIEW - FERNANDO TANII","epico-edson":"EPICO 263 EDSON",
  "nau-klabin":"NAU KLABIN APT 1607","landmark-cleito":"LANDMARK 138 CLEITO",
  "landmark-202":"LANDMARK APT 202","duett-mooca":"LIVING DUETT - MOOCA",
  "epico-analice":"EPICO 154 - ANALICE","hl-227":"HL 227"
};
const USERS = [
  { username:"leonardo", password:"leonardofelt2026", role:"admin", nome:"Leonardo Felt", avatar:"LF" },
  { username:"salles", password:"sallesfelt2026", role:"admin", nome:"Salles Paulo", avatar:"SP" },
  { username:"tiago", password:"tiago123", role:"viewer", nome:"Tiago Engenheiro", avatar:"TE" },
  { username:"rafael", password:"felt2026", role:"estagiario", nome:"Rafael Estagiário", avatar:"RF" }
];
// Etapas padrão do cronograma de obras
const ETAPAS_PADRAO = [
  "Demolição","Alvenaria","Instalações Elétricas","Instalações Hidráulicas",
  "Drywall/Forro","Impermeabilização","Contrapiso","Revestimento",
  "Pintura","Marcenaria","Vidraçaria/Serralheria","Louças e Metais",
  "Limpeza Final","Entrega"
];
// Checklist obrigatório por obra
const CHECKLIST_ITEMS = ["ART registrada","Contrato assinado","Cronograma definido","Portal criado","1ª medição"];
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

// ─── LOGO FELT ───
// Monograma "F" estilizado: duas barras horizontais + haste vertical com curva inferior esquerda
const FeltLogo = ({size=38,color=C.gold}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect x="18" y="18" width="58" height="11" rx="2" fill={color}/>
    <rect x="18" y="48" width="58" height="11" rx="2" fill={color}/>
    <path d="M18 59 L18 82 Q18 93 29 93 L38 93 L38 82 L29 82 Q29 82 29 82 L29 59" fill={color}/>
  </svg>
);

// ══════════════════════════════════════════════════════════════════
// ─── PORTAL DO CLIENTE ───
// Renderizado quando a URL contém ?portal=<token>
// Acesso completo: cronograma + status + custos + fotos + timeline + aditivos
// ══════════════════════════════════════════════════════════════════
function ClientPortal({ token, data }) {
  // Buscar nome do cliente: primeiro no mapa estático, depois nos clientes do Firebase
  let clienteNome = PORTAL_TOKENS[token];
  if (!clienteNome && data?.clientes) {
    const cl = Object.values(data.clientes).find(c => c.portalToken === token);
    if (cl) clienteNome = cl.nome;
  }
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
                boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
                border: `1px solid ${C.gold}44`
              }}><FeltLogo size={36}/></div>
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
            {id:"rdos",label:"📋 RDOs"},
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
              {(() => {
                const docs = Object.values(data.documentos || {}).filter(d => d.cliente === clienteNome);
                return docs.length > 0 ? (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                    {docs.map(d=>(
                      <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" style={{
                        background:C.bg,
                        borderRadius:12,
                        border:`1px solid ${C.border}`,
                        padding:"18px",
                        cursor:"pointer",
                        transition:"all 0.2s",
                        textDecoration:"none",
                        color:"inherit",
                        display:"block"
                      }} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"66";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
                        <div style={{fontSize:28,marginBottom:10}}>{
                          d.tipo==="ART"?"📋":d.tipo==="RDO"?"📊":d.tipo==="FOTOS"?"📸":d.tipo==="PROJETO"?"📐":d.tipo==="360"?"📹":"📄"
                        }</div>
                        <p style={{fontSize:13,fontWeight:700,marginBottom:4}}>{d.titulo}</p>
                        <p style={{fontSize:11,color:C.textDim}}>{d.descricao || d.tipo}</p>
                        <p style={{fontSize:10,color:C.gold,marginTop:10,fontWeight:600}}>📎 Abrir documento →</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p style={{color:C.textDim,fontSize:13,padding:"20px 0",textAlign:"center"}}>Documentos serão compartilhados conforme a obra avança</p>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB: RDOS */}
        {tab === "rdos" && (() => {
          const rdosObra = Object.values(data.rdos || {}).filter(r => r.obraId === (obraMatch ? obraMatch.id : "")).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
          return (
            <div>
              {rdosObra.length === 0 ? (
                <div style={{background:C.surface,borderRadius:16,border:"1px solid "+C.border,padding:"40px",textAlign:"center"}}>
                  <p style={{color:C.textDim,fontSize:13}}>Nenhum RDO registrado para esta obra ainda</p>
                </div>
              ) : rdosObra.map(function(r,idx) {
                var fotosRdo = Array.isArray(r.fotos) ? r.fotos.filter(function(x){return x}) : [];
                return (
                  <div key={r.id||idx} style={{background:C.surface,borderRadius:16,border:"1px solid "+C.border,padding:"20px 24px",marginBottom:12}}>
                    <p style={{fontSize:15,fontWeight:800,marginBottom:8}}>{fmtD(r.data)}</p>
                    {r.equipePres && <p style={{fontSize:12,color:C.textMuted,marginBottom:6}}>Equipe: {r.equipePres}</p>}
                    <p style={{fontSize:13,lineHeight:1.6,marginBottom:8,whiteSpace:"pre-line"}}>{r.atividades}</p>
                    {r.ocorrencias && <p style={{fontSize:12,color:C.amber,marginBottom:6}}>Ocorrências: {r.ocorrencias}</p>}
                    {r.materiaisRecebidos && <p style={{fontSize:12,color:C.textDim,marginBottom:6}}>Materiais: {r.materiaisRecebidos}</p>}
                    {fotosRdo.length > 0 && (
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6,marginTop:8}}>
                        {fotosRdo.map(function(f2,i2){return(
                          <a key={i2} href={f2} target="_blank" rel="noopener noreferrer" style={{display:"block",borderRadius:8,overflow:"hidden",border:"1px solid "+C.border,aspectRatio:"1"}}>
                            <img src={f2} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
                          </a>
                        );})}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

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
        if (found.role === "estagiario") setPage("obras");
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
              boxShadow:`0 12px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)`,
              border:`1px solid ${C.gold}33`
            }}><FeltLogo size={48}/></div>
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

  // ── RATEIO MENSALISTAS — BASEADO EM LANÇAMENTOS MANUAIS ──
  // Cada pagamento de mensalista (tipo "funcionario") é rateado igualmente
  // entre as obras EM ANDAMENTO que já tinham atividade no mês do lançamento.
  // Isso evita que uma obra iniciada em abril receba rateio de janeiro.
  const totalSalariosMensal = mensalistas.reduce((s,m)=>s+(m.salario||0),0);
  const lancsFuncionario = lancs.filter(l => l.tipo === "funcionario");

  // Detectar em quais meses cada obra teve atividade (lançamentos diretos ou diárias)
  const obraAtividadeMeses = {};
  obras.forEach(o => {
    const mesesObra = new Set();
    // lançamentos diretos da obra
    lancs.filter(l => l.obraId === o.id && l.tipo === "obra").forEach(l => {
      if (l.data) mesesObra.add(l.data.slice(0,7));
    });
    // diárias na obra
    diariasList.filter(d => d.obraId === o.id).forEach(d => {
      if (d.data) mesesObra.add(d.data.slice(0,7));
    });
    obraAtividadeMeses[o.id] = mesesObra;
  });

  // Para cada lançamento de funcionário, identificar obras ativas naquele mês
  // e calcular quanto cada obra recebe de rateio
  const rateioMensalistaObra = {};
  obras.forEach(o => { rateioMensalistaObra[o.id] = 0; });

  lancsFuncionario.forEach(l => {
    const mesLanc = l.data?.slice(0,7);
    if (!mesLanc) return;
    // Obras em andamento que tinham atividade naquele mês
    const obrasDoMes = obrasAtivas.filter(o => obraAtividadeMeses[o.id]?.has(mesLanc));
    // Se nenhuma obra ativa no mês, distribuir entre todas ativas (fallback)
    const alvos = obrasDoMes.length > 0 ? obrasDoMes : obrasAtivas;
    if (alvos.length === 0) return;
    const parcela = (l.valor || 0) / alvos.length;
    alvos.forEach(o => { rateioMensalistaObra[o.id] = (rateioMensalistaObra[o.id]||0) + parcela; });
  });

  const rateioPorObra = obrasAtivas.length > 0 ? totalSalariosMensal / obrasAtivas.length : 0;

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

  // Rateio mensalista por obra: agora vem do cálculo real acima (não mais automático genérico)
  const mensalistaCustoObra = oid => rateioMensalistaObra[oid] || 0;

  // ── RATEIO OPERACIONAL SEM OBRA — igual mensalistas ──
  // Lançamentos operacionais COM obraId vão direto pra obra.
  // SEM obraId são rateados igualmente entre obras ativas.
  const custoOpDireto = oid => lancs
    .filter(l => l.obraId === oid && l.tipo === "operacional")
    .reduce((s,l)=>s+(l.valor||0),0);

  const custoOpSemObra = lancs
    .filter(l => l.tipo === "operacional" && !l.obraId)
    .reduce((s,l)=>s+(l.valor||0),0);
  const rateioOpPorObra = obrasAtivas.length > 0 ? custoOpSemObra / obrasAtivas.length : 0;

  const custosOpObra = oid => {
    const obra = obras.find(o => o.id === oid);
    const direto = custoOpDireto(oid);
    const rateio = (obra && obra.status === "Em andamento") ? rateioOpPorObra : 0;
    return direto + rateio;
  };

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
    const exFinanceira = o.contrato > 0 ? custo/o.contrato : 0;
    const ex = (o.execucaoManual || 0) / 100; // % físico manual (0-100 armazenado, 0-1 exibido)
    const semDadosReais = custoDireto === 0 && diariasCustoObra(o.id) === 0;
    return {
      ...o, custo, custoDireto, imposto:imp, rtVal:rtV, recLiq,
      lucroBruto:lb, lucroLiq:ll, margem:m, margemLiq:ml, roi, execucao:ex, exFinanceira,
      semDadosReais,
      color: palette[idx % palette.length]
    };
  });

  const isAdmin = user.role === "admin";
  const isDiarista = user.role === "diarista";
  const isEstagiario = user.role === "estagiario";
  const canEdit = isAdmin || isEstagiario;
  const canSeeFinanceiro = isAdmin;

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

  // Documentos (links externos para portal do cliente)
  const fbAddDoc = d => {
    const id = uid();
    set(ref(fdb,`documentos/${id}`), {...d,id});
    fbLog("Documento adicionado", d.titulo + " — " + d.cliente);
    showToast("Documento publicado no portal");
  };
  const fbDelDoc = docId => {
    const key = Object.keys(data.documentos||{}).find(k => data.documentos[k].id === docId || k === docId);
    if (!key) return;
    remove(ref(fdb,`documentos/${key}`));
    fbLog("Documento removido", docId);
    showToast("Documento removido");
  };

  // Aditivos — editar e excluir
  const fbEditAditivo = (adId,u) => {
    const key = Object.keys(data.aditivos||{}).find(k => data.aditivos[k].id === adId || k === adId);
    if (!key) { showToast("Erro: aditivo não encontrado"); return; }
    update(ref(fdb,`aditivos/${key}`), u);
    fbLog("Aditivo editado", u.descricao || adId);
    showToast("Aditivo atualizado");
  };
  const fbDelAditivo = adId => {
    const key = Object.keys(data.aditivos||{}).find(k => data.aditivos[k].id === adId || k === adId);
    if (!key) return;
    remove(ref(fdb,`aditivos/${key}`));
    fbLog("Aditivo removido", adId);
    showToast("Aditivo removido");
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

  // ════════════════════════════════════════════════════════════════
  // NOVOS CRUDs — MÓDULOS DE GESTÃO V3
  // ════════════════════════════════════════════════════════════════

  // ─── RDO DIGITAL (item 6) ───
  const fbAddRdo = r => { const id = uid(); set(ref(fdb,`rdos/${id}`),{...r,id}); fbLog("RDO registrado",r.obraId+" "+r.data); showToast("RDO salvo"); };
  const fbEditRdo = (rdoId,u) => {
    const key = Object.keys(data.rdos||{}).find(k=>data.rdos[k].id===rdoId||k===rdoId);
    if(key) update(ref(fdb,"rdos/"+key),u);
    showToast("RDO atualizado");
  };
  const fbDelRdo = (rdoId) => {
    const key = Object.keys(data.rdos||{}).find(k=>data.rdos[k].id===rdoId||k===rdoId);
    if(key) remove(ref(fdb,"rdos/"+key));
    fbLog("RDO removido", rdoId);
    showToast("RDO removido");
  };

  // ─── COMPRAS (item 7) ───
  const fbAddCompra = c => { const id = uid(); set(ref(fdb,`compras/${id}`),{...c,id}); fbLog("Compra registrada",c.item+" - "+c.fornecedor); showToast("Compra registrada"); };
  const fbDelCompra = cId => {
    const key = Object.keys(data.compras||{}).find(k=>data.compras[k].id===cId||k===cId);
    if(key) remove(ref(fdb,`compras/${key}`));
    showToast("Compra removida");
  };

  // ─── MEDIÇÕES (item 5) ───
  const fbAddMedicao = m => {
    const id = uid();
    set(ref(fdb,`medicoes/${id}`),{...m,id});
    if(m.valorMedicao && m.cliente) {
      fbAddCob({data:m.data,cliente:m.cliente,valor:m.valorMedicao,status:"A VENCER",obs:"Medição #"+m.numero+" — "+m.percentual+"%"});
    }
    fbLog("Medição registrada",m.cliente+" #"+m.numero);
    showToast("Medição registrada + cobrança gerada");
  };

  // ─── CRONOGRAMA DE ETAPAS (item 3) ───
  const fbSaveCronograma = (obraId,etapas) => {
    update(ref(fdb,`obras/${obraId}`),{cronograma:etapas});
    showToast("Cronograma atualizado");
  };

  // ─── ORÇAMENTO PREVISTO (item 4) ───
  const fbSaveOrcamento = (obraId,orc) => {
    update(ref(fdb,`obras/${obraId}`),{orcamento:orc});
    showToast("Orçamento salvo");
  };

  // ─── TESOURARIA (item 2) ───
  const fbSaveSaldoInicial = val => {
    set(ref(fdb,`config/saldoInicial`),val);
    showToast("Saldo inicial atualizado");
  };

  // Dados derivados dos novos módulos
  const rdos = Object.values(data.rdos||{});
  const compras = Object.values(data.compras||{});
  const medicoes = Object.values(data.medicoes||{});
  const saldoInicial = data.config?.saldoInicial || 0;

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
      centroCusto: tipo==="obra"?"MATERIAL":tipo==="funcionario"?"TIAGO":tipo==="operacional"?"COMBUSTÍVEL":"CONTABILIDADE",
      obs: "",
      obraId: tipo==="obra" ? (selObra || (obras[0]?.id ?? "")) : "",
      tipo
    });
    const cc = tipo==="obra" ? allCC : tipo==="funcionario" ? CC_FUNC : tipo==="operacional" ? CC_OPER : CC_ADM;
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
        {tipo==="operacional" && (
          <Field label="Obra (opcional)" hint="Deixe vazio para ratear entre todas as obras em andamento">
            <select value={f.obraId} onChange={e=>setF(p=>({...p,obraId:e.target.value}))} style={selectStyle}>
              <option value="">🔄 Ratear entre todas as obras</option>
              {obrasAtivas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}
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
      status: initial.status,
      execucaoManual: initial.execucaoManual || 0
    } : { nome:"", contrato:"", aliquota:0, rt:0, status:"Em andamento", execucaoManual:0 });
    const doSave = () => {
      if (!f.nome || !f.contrato) return;
      const d = {
        nome: f.nome,
        contrato: parseFloat(f.contrato),
        aliquota: (parseFloat(f.aliquota)||0)/100,
        rt: (parseFloat(f.rt)||0)/100,
        status: f.status,
        execucaoManual: parseFloat(f.execucaoManual) || 0
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
        <Field label={`Execução Física (${f.execucaoManual}%)`} hint="Progresso real da obra — arraste o slider ou digite o valor">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <input type="range" min="0" max="100" step="1" value={f.execucaoManual} onChange={e=>setF(p=>({...p,execucaoManual:e.target.value}))} style={{flex:1,accentColor:C.gold}}/>
            <input type="number" min="0" max="100" value={f.execucaoManual} onChange={e=>setF(p=>({...p,execucaoManual:e.target.value}))} style={{...inputStyle,width:70,textAlign:"center",padding:"8px"}}/>
          </div>
        </Field>
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
    // Clientes com portal: do Firebase (portalToken) OU do mapa PORTAL_TOKENS
    const portalNomes = new Set(Object.values(PORTAL_TOKENS));
    const clientesComPortal = clientes.filter(c => c.portalToken || portalNomes.has(c.nome));
    // Se nenhum cliente tem portalToken no Firebase, usar direto do PORTAL_TOKENS
    const listaFinal = clientesComPortal.length > 0
      ? clientesComPortal
      : Object.values(PORTAL_TOKENS).map((nome,i) => ({id:`pt${i}`,nome}));
    return (
      <Modal title="Propor Aditivo ao Cliente" onClose={onClose}>
        <Field label="Cliente" hint="Apenas clientes com portal ativo">
          <select value={f.cliente} onChange={e=>setF(p=>({...p,cliente:e.target.value}))} style={selectStyle}>
            <option value="">Selecione...</option>
            {listaFinal.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
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

  const AditivoEditForm = ({initial,onClose}) => {
    const [f,setF] = useState({
      data: initial.data || "",
      cliente: initial.cliente || "",
      valor: initial.valor || "",
      descricao: initial.descricao || "",
      status: initial.status || "pendente"
    });
    const doSave = () => {
      if (!f.cliente || !f.valor || !f.descricao) return;
      fbEditAditivo(initial.id, { ...f, valor: parseFloat(f.valor) });
      onClose();
    };
    return (
      <Modal title="Editar Aditivo" onClose={onClose}>
        <Field label="Cliente">
          <input value={f.cliente} disabled style={{...inputStyle,opacity:0.6,cursor:"not-allowed"}}/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={selectStyle}>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="recusado">Recusado</option>
            </select>
          </Field>
        </div>
        <Field label="Descrição">
          <textarea rows={3} value={f.descricao} onChange={e=>setF(p=>({...p,descricao:e.target.value}))} style={{...inputStyle,resize:"vertical"}}/>
        </Field>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>Salvar Alterações</button>
      </Modal>
    );
  };

  const DocForm = ({onClose}) => {
    const [f,setF] = useState({
      cliente: "", tipo: "RDO", titulo: "", url: "", descricao: ""
    });
    const portalNomes = new Set(Object.values(PORTAL_TOKENS));
    const clientesComPortal2 = clientes.filter(c => c.portalToken || portalNomes.has(c.nome));
    const listaDoc = clientesComPortal2.length > 0
      ? clientesComPortal2
      : Object.values(PORTAL_TOKENS).map((nome,i) => ({id:`pt${i}`,nome}));
    const doSave = () => {
      if (!f.cliente || !f.url || !f.titulo) return;
      fbAddDoc(f);
      onClose();
    };
    return (
      <Modal title="Publicar Documento no Portal" onClose={onClose}>
        <Field label="Cliente">
          <select value={f.cliente} onChange={e=>setF(p=>({...p,cliente:e.target.value}))} style={selectStyle}>
            <option value="">Selecione...</option>
            {listaDoc.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Tipo">
            <select value={f.tipo} onChange={e=>setF(p=>({...p,tipo:e.target.value}))} style={selectStyle}>
              {["ART","RDO","FOTOS","PROJETO","360","CONTRATO","MEMORIAL","OUTRO"].map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Título">
            <input value={f.titulo} onChange={e=>setF(p=>({...p,titulo:e.target.value}))} style={inputStyle} placeholder="Ex: ART Registrada - CREA 12345"/>
          </Field>
        </div>
        <Field label="Link externo (Google Drive, Dropbox, etc.)" hint="Cole aqui o link de compartilhamento do arquivo">
          <input value={f.url} onChange={e=>setF(p=>({...p,url:e.target.value}))} style={inputStyle} placeholder="https://drive.google.com/file/d/..."/>
        </Field>
        <Field label="Descrição (opcional)">
          <input value={f.descricao} onChange={e=>setF(p=>({...p,descricao:e.target.value}))} style={inputStyle} placeholder="Ex: Relatório Diário de Obra - Semana 12"/>
        </Field>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>Publicar no Portal</button>
      </Modal>
    );
  };

  const PortalForm = ({onClose}) => {
    const [f,setF] = useState({ clienteId:"", tokenCustom:"" });
    // Clientes SEM portal ativo
    const clientesSemPortal = clientes.filter(c => !c.portalToken && !Object.values(PORTAL_TOKENS).includes(c.nome));
    const gerarToken = nome => nome.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+$/,"").slice(0,30);
    const clienteSelecionado = clientes.find(c => c.id === f.clienteId);
    const tokenPreview = f.tokenCustom || (clienteSelecionado ? gerarToken(clienteSelecionado.nome) : "");
    const linkPreview = tokenPreview ? `${window.location.origin}${window.location.pathname}?portal=${tokenPreview}` : "";

    const doSave = () => {
      if (!f.clienteId || !tokenPreview) return;
      const cliente = clientes.find(c => c.id === f.clienteId);
      if (!cliente) return;
      // Salvar portalToken no cliente no Firebase
      const key = Object.keys(data.clientes||{}).find(k => data.clientes[k].id === f.clienteId || k === f.clienteId);
      if (key) {
        update(ref(fdb,`clientes/${key}`), { portalToken: tokenPreview });
      }
      // Adicionar ao PORTAL_TOKENS em runtime
      PORTAL_TOKENS[tokenPreview] = cliente.nome;
      fbLog("Portal criado", `${cliente.nome} → ${tokenPreview}`);
      showToast(`Portal criado para ${cliente.nome}`);
      onClose();
    };

    return (
      <Modal title="Criar Portal para Cliente" onClose={onClose}>
        <Field label="Cliente" hint={clientesSemPortal.length === 0 ? "Todos os clientes já têm portal" : `${clientesSemPortal.length} clientes sem portal`}>
          <select value={f.clienteId} onChange={e=>{
            setF(p=>({...p,clienteId:e.target.value}));
            const cl = clientes.find(c=>c.id===e.target.value);
            if (cl) setF(p=>({...p,clienteId:e.target.value,tokenCustom:gerarToken(cl.nome)}));
          }} style={selectStyle}>
            <option value="">Selecione um cliente...</option>
            {clientesSemPortal.map(c=><option key={c.id} value={c.id}>{c.nome} ({c.ano})</option>)}
          </select>
        </Field>
        <Field label="Token do portal" hint="Usado na URL. Apenas letras minúsculas, números e hífens.">
          <input value={f.tokenCustom || tokenPreview} onChange={e=>setF(p=>({...p,tokenCustom:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")}))} style={inputStyle} placeholder="ex: parkview-tanii"/>
        </Field>
        {linkPreview && (
          <div style={{background:C.bg,borderRadius:12,border:`1px solid ${C.gold}33`,padding:"14px 18px",marginBottom:14}}>
            <p style={{fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Link que o cliente receberá</p>
            <p style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:C.gold,wordBreak:"break-all"}}>{linkPreview}</p>
          </div>
        )}
        <button onClick={doSave} disabled={!f.clienteId} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0",opacity:f.clienteId?1:0.5}}>Criar Portal</button>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════

  // ── NOVOS FORMS ──

  const RdoForm = ({onClose}) => {
    const [f,setF] = useState({
      obraId: obrasAtivas[0]?.id || "",
      data: new Date().toISOString().slice(0,10),
      clima: "Ensolarado",
      equipePres: "",
      atividades: "",
      ocorrencias: "",
      materiaisRecebidos: ""
    });
    const [fotos,setFotos] = useState([]); // {file,preview,uploading,url,error}
    const [saving,setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const handleFiles = (files) => {
      const newFotos = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        url: null,
        error: null,
        name: file.name
      }));
      setFotos(prev => [...prev, ...newFotos]);
    };

    const removeFoto = i => {
      setFotos(prev => {
        if(prev[i]?.preview) URL.revokeObjectURL(prev[i].preview);
        return prev.filter((_,j)=>j!==i);
      });
    };

    const uploadAllFotos = async () => {
      // Ponto 11: fotos organizadas por obra: fotos-obras/NOME-DA-OBRA/2026-04-28/foto-0.jpg
      const obraNome = (obras.find(o=>o.id===f.obraId)||{}).nome || "obra";
      const pastaObra = obraNome.replace(/[^a-zA-Z0-9À-ú ]/g,"").replace(/ +/g,"-").toLowerCase();
      const results = [];
      for (let i=0; i<fotos.length; i++) {
        const foto = fotos[i];
        if (foto.url) { results.push(foto.url); continue; }
        setFotos(prev => prev.map((p,j) => j===i ? {...p,uploading:true} : p));
        try {
          if (storage) {
            const ext = (foto.file.name||"foto.jpg").split(".").pop() || "jpg";
            const path = "fotos-obras/" + pastaObra + "/" + f.data + "/foto-" + i + "-" + Date.now() + "." + ext;
            const storageRef = sRef(storage, path);
            await uploadBytes(storageRef, foto.file);
            const url = await getDownloadURL(storageRef);
            results.push(url);
            setFotos(prev => prev.map((p,j) => j===i ? {...p,uploading:false,url:url} : p));
          } else {
            // Fallback sem Storage: converter para base64
            const base64 = await new Promise(function(res,rej) {
              var reader = new FileReader();
              reader.onload = function() { res(reader.result); };
              reader.onerror = rej;
              reader.readAsDataURL(foto.file);
            });
            results.push(base64);
            setFotos(prev => prev.map((p,j) => j===i ? {...p,uploading:false,url:base64} : p));
          }
        } catch(err) {
          console.error("Upload falhou:", err);
          setFotos(prev => prev.map((p,j) => j===i ? {...p,uploading:false,error:err.message||"Falha"} : p));
        }
      }
      return results.filter(Boolean);
    };

    const doSave = async () => {
      if(!f.obraId||!f.atividades) return;
      setSaving(true);
      try {
        const urls = fotos.length > 0 ? await uploadAllFotos() : [];
        fbAddRdo({...f, fotos: urls});
        onClose();
      } catch(err) {
        console.error(err);
        setSaving(false);
      }
    };

    return (
      <Modal title="Registrar RDO" onClose={onClose} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Obra">
            <select value={f.obraId} onChange={e=>setF(p=>({...p,obraId:e.target.value}))} style={selectStyle}>
              {obrasAtivas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <Field label="Equipe presente">
          <input value={f.equipePres} onChange={e=>setF(p=>({...p,equipePres:e.target.value}))} style={inputStyle} placeholder="Ex: Noel, Allef, Carlos"/>
        </Field>
        <Field label="Atividades executadas">
          <textarea rows={3} value={f.atividades} onChange={e=>setF(p=>({...p,atividades:e.target.value}))} style={{...inputStyle,resize:"vertical"}} placeholder="Descreva as atividades realizadas no dia..."/>
        </Field>
        <Field label="Ocorrências / Observações">
          <textarea rows={2} value={f.ocorrencias} onChange={e=>setF(p=>({...p,ocorrencias:e.target.value}))} style={{...inputStyle,resize:"vertical"}} placeholder="Problemas, atrasos, pendências..."/>
        </Field>
        <Field label="Materiais recebidos no dia">
          <input value={f.materiaisRecebidos} onChange={e=>setF(p=>({...p,materiaisRecebidos:e.target.value}))} style={inputStyle} placeholder="Ex: 50 sacos cimento, 20m² porcelanato"/>
        </Field>

        {/* UPLOAD DE FOTOS — direto da galeria */}
        <Field label={`Fotos do dia (${fotos.length} selecionadas)`} hint="Selecione da galeria do celular ou câmera. Múltiplas fotos de uma vez.">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e=>handleFiles(e.target.files)}
            style={{display:"none"}}
          />
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <button onClick={()=>fileInputRef.current?.click()} style={{
              ...btnGhost,flex:1,justifyContent:"center",padding:"14px 0",
              borderColor:C.gold+"44",color:C.gold,fontSize:13
            }}>📸 Selecionar da galeria</button>
            <button onClick={()=>{
              const inp = document.createElement("input");
              inp.type="file"; inp.accept="image/*"; inp.capture="environment";
              inp.onchange=e=>handleFiles(e.target.files);
              inp.click();
            }} style={{
              ...btnGhost,justifyContent:"center",padding:"14px 16px",
              borderColor:C.cyan+"44",color:C.cyan,fontSize:13
            }}>📷 Tirar foto</button>
          </div>

          {fotos.length > 0 && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
              {fotos.map((foto,i)=>(
                <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",border:`1px solid ${foto.error?C.red:foto.url?C.green:C.border}`,aspectRatio:"1"}}>
                  <img src={foto.preview} alt={`Foto ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  {foto.uploading && (
                    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{width:24,height:24,border:`2px solid ${C.gold}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                    </div>
                  )}
                  {foto.url && (
                    <div style={{position:"absolute",top:4,left:4,background:C.green,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>✓</div>
                  )}
                  {foto.error && (
                    <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.red+"dd",padding:"4px",fontSize:9,color:"#fff",textAlign:"center"}}>{foto.error}</div>
                  )}
                  <button onClick={()=>removeFoto(i)} style={{
                    position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.7)",border:"none",
                    color:"#fff",width:22,height:22,borderRadius:"50%",cursor:"pointer",fontSize:12,
                    display:"flex",alignItems:"center",justifyContent:"center"
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <button onClick={doSave} disabled={saving} style={{
          ...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0",
          opacity:saving?0.6:1,cursor:saving?"wait":"pointer"
        }}>
          {saving ? (
            <span style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:16,height:16,border:`2px solid #000`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
              Enviando {fotos.length} fotos...
            </span>
          ) : "Salvar RDO" + (fotos.length>0 ? " (" + fotos.length + " fotos)" : "")}
        </button>
      </Modal>
    );
  };

  const CompraForm = ({onClose}) => {
    const [f,setF] = useState({
      obraId: obrasAtivas[0]?.id||"",
      data: new Date().toISOString().slice(0,10),
      item: "", fornecedor: "", quantidade: "", unidade: "un",
      valorUnitario: "", nfFornecedor: ""
    });
    const doSave = () => {
      if(!f.item||!f.valorUnitario) return;
      const d = {...f,valorUnitario:parseFloat(f.valorUnitario),quantidade:parseFloat(f.quantidade)||1,valorTotal:(parseFloat(f.valorUnitario)||0)*(parseFloat(f.quantidade)||1)};
      fbAddCompra(d);
      // Auto-criar lançamento de obra correspondente
      if(f.obraId){
        fbAddLanc({descricao:`${f.item} — ${f.fornecedor}`,valor:d.valorTotal,data:f.data,centroCusto:"MATERIAL",obs:`NF: ${f.nfFornecedor||"—"} | Qtd: ${f.quantidade} ${f.unidade}`,obraId:f.obraId,tipo:"obra"});
      }
      onClose();
    };
    return (
      <Modal title="Registrar Compra" onClose={onClose} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Obra">
            <select value={f.obraId} onChange={e=>setF(p=>({...p,obraId:e.target.value}))} style={selectStyle}>
              <option value="">Sem obra (geral)</option>
              {obrasAtivas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
          <Field label="Item / Material">
            <input value={f.item} onChange={e=>setF(p=>({...p,item:e.target.value}))} style={inputStyle} placeholder="Ex: Porcelanato 60x120 acetinado"/>
          </Field>
          <Field label="Fornecedor">
            <input value={f.fornecedor} onChange={e=>setF(p=>({...p,fornecedor:e.target.value}))} style={inputStyle} placeholder="Ex: Leroy Merlin"/>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
          <Field label="Qtd">
            <input type="number" value={f.quantidade} onChange={e=>setF(p=>({...p,quantidade:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="Un.">
            <select value={f.unidade} onChange={e=>setF(p=>({...p,unidade:e.target.value}))} style={selectStyle}>
              {["un","m²","m³","m","kg","L","sc","pç","cx","rl"].map(u=><option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Valor unitário">
            <input type="number" step="0.01" value={f.valorUnitario} onChange={e=>setF(p=>({...p,valorUnitario:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="NF fornecedor">
            <input value={f.nfFornecedor} onChange={e=>setF(p=>({...p,nfFornecedor:e.target.value}))} style={inputStyle} placeholder="Nº NF"/>
          </Field>
        </div>
        {f.valorUnitario && f.quantidade && (
          <div style={{background:C.bg,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:C.textMuted}}>Total da compra:</span>
            <span style={{fontSize:16,fontWeight:800,color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{R$((parseFloat(f.valorUnitario)||0)*(parseFloat(f.quantidade)||1))}</span>
          </div>
        )}
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>Registrar Compra</button>
      </Modal>
    );
  };

  const MedicaoForm = ({onClose}) => {
    const [f,setF] = useState({
      obraId: obrasAtivas[0]?.id||"",
      data: new Date().toISOString().slice(0,10),
      numero: (medicoes.length+1)+"",
      percentual: "",
      cliente: "",
      descricao: ""
    });
    const obraSel = obras.find(o=>o.id===f.obraId);
    const valorMedicao = obraSel ? (obraSel.contrato||0) * (parseFloat(f.percentual)||0)/100 : 0;
    // Auto-preencher cliente
    const autoCliente = (() => {
      if(!f.obraId) return "";
      const keys = OBRA_CLIENTE_MAP[f.obraId]||[];
      const cl = clientes.find(c => keys.some(k => c.nome.toUpperCase().includes(k.toUpperCase())));
      return cl?.nome || "";
    })();
    const doSave = () => {
      if(!f.obraId||!f.percentual) return;
      const cliente = f.cliente || autoCliente;
      fbAddMedicao({...f,cliente,valorMedicao,percentual:parseFloat(f.percentual)});
      // Atualizar execução da obra
      if(obraSel) {
        const totalMedido = medicoes.filter(m=>m.obraId===f.obraId).reduce((s,m)=>s+(m.percentual||0),0) + parseFloat(f.percentual);
        fbEditObra(f.obraId, {execucaoManual: Math.min(totalMedido,100)});
      }
      onClose();
    };
    return (
      <Modal title="Registrar Medição" onClose={onClose}>
        <Field label="Obra">
          <select value={f.obraId} onChange={e=>setF(p=>({...p,obraId:e.target.value}))} style={selectStyle}>
            {obrasAtivas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <Field label="Medição #">
            <input type="number" value={f.numero} onChange={e=>setF(p=>({...p,numero:e.target.value}))} style={inputStyle}/>
          </Field>
          <Field label="% executado neste período">
            <input type="number" step="0.1" value={f.percentual} onChange={e=>setF(p=>({...p,percentual:e.target.value}))} style={inputStyle} placeholder="Ex: 15"/>
          </Field>
          <Field label="Data">
            <input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/>
          </Field>
        </div>
        <Field label="Cliente" hint="Auto-preenchido pela obra">
          <input value={f.cliente||autoCliente} onChange={e=>setF(p=>({...p,cliente:e.target.value}))} style={inputStyle}/>
        </Field>
        {valorMedicao > 0 && (
          <div style={{background:C.green+"12",borderRadius:10,padding:"12px 16px",marginBottom:14,border:`1px solid ${C.green}33`}}>
            <p style={{fontSize:11,color:C.textDim}}>Valor da medição ({f.percentual}% de {R$(obraSel?.contrato)}):</p>
            <p style={{fontSize:20,fontWeight:800,color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>{R$(valorMedicao)}</p>
            <p style={{fontSize:11,color:C.textMuted,marginTop:4}}>Uma cobrança será gerada automaticamente</p>
          </div>
        )}
        <Field label="Descrição">
          <input value={f.descricao} onChange={e=>setF(p=>({...p,descricao:e.target.value}))} style={inputStyle} placeholder="Ex: Alvenaria + elétrica concluídas"/>
        </Field>
        <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>Registrar Medição</button>
      </Modal>
    );
  };
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

      {/* GESTÃO INTELIGENTE */}
      {(() => {
        // Alerta: obras sem lançamento há 15+ dias
        const hojeMs = new Date("2026-04-15").getTime();
        const obrasSemLanc = obrasAtivas.filter(o => {
          const lancsObra = lancs.filter(l => l.obraId === o.id);
          if (!lancsObra.length) return true;
          const ultData = Math.max(...lancsObra.map(l => new Date(l.data).getTime()));
          return (hojeMs - ultData) > 15 * 86400000;
        });
        // Alerta: aditivos aprovados sem impacto no contrato
        const aditivosAprovados = aditivos.filter(a => a.status === "aprovado");
        // Alerta: obras sem NF emitida com mais de 30% recebido
        const obrasSemNf = obrasAtivas.filter(o => {
          const recebido = obraRecebido(o.id);
          const temNf = nfsList.some(n => {
            const keys = OBRA_CLIENTE_MAP[o.id] || [];
            return keys.some(k => n.cliente?.toUpperCase().includes(k.toUpperCase()));
          });
          return recebido > (o.contrato * 0.3) && !temNf;
        });
        // Checklist por obra: itens obrigatórios
        const CHECKLIST_ITEMS = ["ART registrada","Contrato assinado","Cronograma definido","Portal criado","1ª medição"];
        const obrasChecklist = obrasAtivas.map(o => {
          const ck = o.checklist || {};
          const done = CHECKLIST_ITEMS.filter(item => ck[item]);
          return { ...o, ck, done: done.length, total: CHECKLIST_ITEMS.length };
        });
        const obrasChecklistIncompleto = obrasChecklist.filter(o => o.done < o.total);

        const hasAlerts = obrasSemLanc.length > 0 || aditivosAprovados.length > 0 || obrasSemNf.length > 0 || obrasChecklistIncompleto.length > 0;
        if (!hasAlerts) return null;

        return (
          <div style={{marginBottom:20,display:"grid",gap:10}}>
            {obrasSemLanc.length > 0 && (
              <div style={{background:C.purple+"10",borderRadius:14,border:`1px solid ${C.purple}33`,padding:"14px 20px"}}>
                <p style={{fontSize:13,fontWeight:800,color:C.purple}}>🔕 {obrasSemLanc.length} obras sem lançamento há 15+ dias</p>
                <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                  {obrasSemLanc.map(o=>(
                    <span key={o.id} onClick={()=>{setSelObra(o.id);setPage("obras");}} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:C.purple+"18",color:C.purple,cursor:"pointer"}}>{o.nome}</span>
                  ))}
                </div>
              </div>
            )}
            {obrasSemNf.length > 0 && (
              <div style={{background:C.cyan+"10",borderRadius:14,border:`1px solid ${C.cyan}33`,padding:"14px 20px"}}>
                <p style={{fontSize:13,fontWeight:800,color:C.cyan}}>🧾 {obrasSemNf.length} obras com recebimento sem NF emitida</p>
                <p style={{fontSize:11,color:C.textMuted,marginTop:4}}>Já receberam mais de 30% do contrato mas não têm NF registrada no sistema</p>
              </div>
            )}
            {aditivosAprovados.length > 0 && (
              <div style={{background:C.green+"10",borderRadius:14,border:`1px solid ${C.green}33`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                <div>
                  <p style={{fontSize:13,fontWeight:800,color:C.green}}>✍️ {aditivosAprovados.length} aditivos aprovados — {R$(aditivosAprovados.reduce((s,a)=>s+(a.valor||0),0))}</p>
                  <p style={{fontSize:11,color:C.textMuted,marginTop:4}}>Valor pode ser somado ao contrato das respectivas obras</p>
                </div>
                <button onClick={()=>{
                  aditivosAprovados.forEach(a => {
                    // Encontrar obra do cliente e somar ao contrato
                    const cl = clientes.find(c => c.nome === a.cliente);
                    if (!cl) return;
                    const obra = obras.find(o => {
                      const keys = OBRA_CLIENTE_MAP[o.id] || [];
                      return keys.some(k => a.cliente.toUpperCase().includes(k.toUpperCase()));
                    });
                    if (obra) {
                      fbEditObra(obra.id, { contrato: (obra.contrato||0) + (a.valor||0) });
                    }
                    // Mudar status para "aplicado"
                    fbEditAditivo(a.id, { status: "aplicado" });
                  });
                  showToast("Aditivos aplicados aos contratos");
                }} style={{...btnGhost,borderColor:C.green+"44",color:C.green,fontSize:11}}>Aplicar ao contrato →</button>
              </div>
            )}
            {obrasChecklistIncompleto.length > 0 && (
              <div style={{background:C.gold+"10",borderRadius:14,border:`1px solid ${C.gold}33`,padding:"14px 20px"}}>
                <p style={{fontSize:13,fontWeight:800,color:C.gold}}>📋 Checklist incompleto em {obrasChecklistIncompleto.length} obras</p>
                <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                  {obrasChecklistIncompleto.map(o=>(
                    <span key={o.id} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:C.gold+"18",color:C.gold}}>{o.nome.replace("OBRA ","")} — {o.done}/{o.total}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
            {(isAdmin || isEstagiario) && (
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {isAdmin && <button onClick={()=>setModal({type:"obraEdit",obra:o})} style={btnGhost}>✏️ Editar</button>}
                {isAdmin && <button onClick={()=>{
                  if(window.confirm("Tem certeza que deseja excluir \""+o.nome+"\"?\n\nTodos os lançamentos desta obra também serão removidos."))
                    fbDelObra(o.id);
                }} style={{...btnGhost,borderColor:C.red+"44",color:C.red}}>🗑️ Excluir</button>}
                <button onClick={function(){
                  var rdosObra = rdos.filter(function(r){return r.obraId===o.id});
                  var todasFotos = [];
                  rdosObra.forEach(function(r){
                    var fotos = Array.isArray(r.fotos) ? r.fotos.filter(function(x){return x}) : [];
                    fotos.forEach(function(url,idx){
                      todasFotos.push({url:url, nome: fmtD(r.data)+"_foto_"+(idx+1)});
                    });
                  });
                  if(todasFotos.length===0){ showToast("Nenhuma foto encontrada nesta obra"); return; }
                  showToast("Baixando "+todasFotos.length+" fotos...");
                  todasFotos.forEach(function(f,i){
                    setTimeout(function(){
                      var a = document.createElement("a");
                      a.href = f.url;
                      a.download = o.nome.replace(/[^a-zA-Z0-9]/g,"_")+"_"+f.nome+".jpg";
                      a.target = "_blank";
                      a.rel = "noopener noreferrer";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }, i * 500);
                  });
                }} style={{...btnGhost,borderColor:C.cyan+"44",color:C.cyan}}>📥 Baixar Fotos ({rdos.filter(function(r){
                  return r.obraId===o.id && Array.isArray(r.fotos) && r.fotos.filter(function(x){return x}).length>0;
                }).reduce(function(s,r){return s+(r.fotos||[]).filter(function(x){return x}).length;},0)})</button>
                <button onClick={()=>setModal({type:"lancForm",tipo:"obra"})} style={btnPrimary}>＋ Lançamento</button>
              </div>
            )}
          </div>

          {canSeeFinanceiro && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
              <MetricCard small label="Contrato" value={R$(o.contrato)} color={C.accent}/>
              <MetricCard small label="Custo Total" value={R$(o.custo)} color={C.amber} sub={`Direto: ${R$(o.custoDireto)}`}/>
              <MetricCard small label="Lucro Bruto" value={R$(o.lucroBruto)} color={o.lucroBruto>=0?C.green:C.red}/>
              <MetricCard small label="Margem" value={pct(o.margem)} color={o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red}/>
              <MetricCard small label="Execução" value={pct(o.execucao)} color={o.execucao>0.8?C.red:o.execucao>0.6?C.amber:C.green}/>
              <MetricCard small label="Já Recebido" value={R$(recebido)} color={C.cyan}/>
            </div>
          )}

          {/* CHECKLIST DA OBRA */}
          {isAdmin && (
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Checklist de Abertura</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {["ART registrada","Contrato assinado","Cronograma definido","Portal criado","1ª medição"].map(item => {
                  const ck = o.checklist || {};
                  const done = !!ck[item];
                  return (
                    <button key={item} onClick={()=>{
                      const newCk = {...(o.checklist||{}), [item]: !done};
                      fbEditObra(o.id, {checklist: newCk});
                    }} style={{
                      padding:"8px 14px",
                      borderRadius:10,
                      border:`1px solid ${done?C.green+"66":C.border}`,
                      background: done ? C.green+"12" : C.bg,
                      color: done ? C.green : C.textMuted,
                      fontSize:12,
                      fontWeight: done ? 700 : 400,
                      cursor:"pointer",
                      transition:"all 0.2s",
                      display:"flex",alignItems:"center",gap:6
                    }}>
                      <span style={{fontSize:14}}>{done ? "✅" : "⬜"}</span>
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                  <span style={{fontSize:11,color:C.purple}}>RATEIO MENSALISTAS</span>
                  <span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(mensalistaCustoObra(o.id))}</span>
                </div>
              )}
              {rateioOpPorObra > 0 && o.status === "Em andamento" && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.amber}44`}}>
                  <div style={{width:8,height:8,borderRadius:4,background:C.amber}}/>
                  <span style={{fontSize:11,color:C.amber}}>RATEIO OPERACIONAL</span>
                  <span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(rateioOpPorObra)}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <TH>Data</TH><TH>Descrição</TH><TH>C.Custo</TH>{canSeeFinanceiro && <TH align="right">Valor</TH>}<TH>Obs</TH>
                  {canEdit && <TH></TH>}
                </tr></thead>
                <tbody>
                  {ls.map(l=>(
                    <tr key={l.id}>
                      <TD>{fmtD(l.data)}</TD>
                      <TD bold>{l.descricao}</TD>
                      <TD><Badge text={l.centroCusto} color={C.purple} size="sm"/></TD>
                      {canSeeFinanceiro && <TD mono bold align="right">{R$(l.valor)}</TD>}
                      <TD color={C.textDim}>{l.obs||"—"}</TD>
                      {canEdit && (
                        <TD>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>setModal({type:"lancEdit",lanc:l,tipo:"obra"})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button>
                            {isAdmin && <button onClick={()=>fbDelLanc(l.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>}
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
                {canSeeFinanceiro ? (
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
                ) : (
                  <div style={{fontSize:12,marginBottom:14}}>
                    <p style={{color:C.textDim,fontSize:11}}>Status: <b style={{color:C.text}}>{o.status}</b></p>
                  </div>
                )}
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
      // rateio mensalista do mês: lançamentos de funcionários daquele mês, rateados pelas obras ativas com atividade
      const lancsDoMes = lancsFuncionario.filter(l => l.data?.startsWith(eqFiltroMes));
      const totalMesFunc = lancsDoMes.reduce((s,l)=>s+(l.valor||0),0);
      const obrasComAtivNoMes = obrasAtivas.filter(ob => obraAtividadeMeses[ob.id]?.has(eqFiltroMes));
      const alvos = obrasComAtivNoMes.length > 0 ? obrasComAtivNoMes : obrasAtivas;
      const rateio = alvos.find(ob => ob.id === o.id) ? totalMesFunc / alvos.length : 0;
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
          <MetricCard small label="Lanç. Func. (total)" value={R$(lancsFuncionario.reduce((s,l)=>s+(l.valor||0),0))} color={C.purple} sub={`${lancsFuncionario.length} pagamentos lançados`}/>
          <MetricCard small label="Diárias (total)" value={R$(custoDiariasTotal)} color={C.cyan} sub={`${diariasList.length} dias lançados`}/>
          <MetricCard small label="Custo Equipe Total" value={R$(lancsFuncionario.reduce((s,l)=>s+(l.valor||0),0) + custoDiariasTotal)} color={C.amber} sub={`rateado em ${obrasAtivas.length} obras`}/>
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
            {/* PAGAMENTO MENSAL — pré-lançamento */}
            {isAdmin && (
              <div style={{background:C.gold+"08",borderRadius:16,border:"1px solid "+C.gold+"33",padding:"20px 24px",marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:12}}>
                  <div>
                    <p style={{fontSize:11,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:1.2}}>Confirmar Pagamento Mensal</p>
                    <p style={{fontSize:12,color:C.textMuted,marginTop:4}}>Lança o salário de cada mensalista e rateia entre as obras em andamento</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <select id="pag-mes" style={{...selectStyle,padding:"8px 12px",fontSize:12,width:160}}>
                      {["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"].map(function(m){
                        var label = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"][parseInt(m.slice(5))-1];
                        return <option key={m} value={m}>{label}/{m.slice(0,4)}</option>;
                      })}
                    </select>
                    <button onClick={function(){
                      var mes = document.getElementById("pag-mes").value;
                      var label = mes.replace("-","/");
                      var jaLancado = lancsFuncionario.some(function(l){return l.data && l.data.startsWith(mes)});
                      if(jaLancado && !window.confirm("Já existem lançamentos de funcionários em "+label+". Deseja lançar novamente?")) return;
                      var count = 0;
                      mensalistas.forEach(function(s){
                        fbAddLanc({
                          descricao: s.nome+" — "+label,
                          valor: s.salario||0,
                          data: mes+"-15",
                          centroCusto: s.nome.split(" ")[0].toUpperCase(),
                          obs: "Pagamento mensal "+label,
                          obraId: "",
                          tipo: "funcionario"
                        });
                        count++;
                      });
                      showToast(count+" pagamentos lançados para "+label);
                    }} style={{...btnPrimary,padding:"9px 16px",fontSize:12}}>✓ Confirmar Pagamento</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {mensalistas.map(function(s){return(
                    <div key={s.id} style={{background:C.bg,borderRadius:8,padding:"6px 12px",border:"1px solid "+C.border,fontSize:12}}>
                      <span style={{fontWeight:700}}>{s.nome}</span>
                      <span style={{color:C.gold,fontFamily:"'JetBrains Mono',monospace",marginLeft:8}}>{R$(s.salario)}</span>
                    </div>
                  );})}
                </div>
              </div>
            )}

            <div style={{background:C.surface,borderRadius:16,border:"1px solid "+C.border,padding:"20px 24px",marginBottom:16}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Mensalistas ({mensalistas.length})</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH>Nome</TH><TH>Função</TH><TH align="right">Salário Base</TH><TH align="right">Pago (lançado)</TH><TH align="right">Rateio na Obra</TH>
                    {isAdmin && <TH></TH>}
                  </tr></thead>
                  <tbody>
                    {mensalistas.map(s=>{
                      // Total lançado para este mensalista (centro de custo = nome)
                      const pago = lancsFuncionario.filter(l => l.centroCusto === s.nome.split(" ")[0].toUpperCase() || l.descricao?.toUpperCase().includes(s.nome.toUpperCase())).reduce((sm,l)=>sm+(l.valor||0),0);
                      return (
                        <tr key={s.id}>
                          <TD bold>{s.nome}</TD>
                          <TD><Badge text={s.funcao} color={C.accent} size="sm"/></TD>
                          <TD mono align="right" color={C.textMuted}>{R$(s.salario)}</TD>
                          <TD mono bold align="right" color={C.green}>{R$(pago)}</TD>
                          <TD mono align="right" color={C.purple}>{obrasAtivas.length>0 ? R$(pago/obrasAtivas.length) : "—"}</TD>
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
              <p style={{fontSize:11,color:C.textMuted,lineHeight:1.6}}>Os pagamentos de mensalistas são lançados manualmente na aba Funcionários. Cada lançamento é rateado igualmente entre as obras em andamento que tiveram atividade no mês correspondente. Assim, uma obra que iniciou em abril não recebe rateio de janeiro. Custos operacionais sem obra alocada também são rateados igualmente.</p>
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
            {(isAdmin || isEstagiario) && (
              <div style={{background:C.surface,borderRadius:16,border:"1px solid "+C.border,padding:"20px 24px",marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Registrar Diárias em Lote</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div>
                    <label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Funcionário</label>
                    <select id="di-func" style={{...inputStyle,padding:"8px 12px",fontSize:12}}>
                      {diaristas.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Semana de referência</label>
                    <input type="date" id="di-semana" defaultValue={new Date().toISOString().slice(0,10)} style={{...inputStyle,padding:"8px 12px",fontSize:12}}/>
                  </div>
                </div>
                <p style={{fontSize:10,color:C.textDim,marginBottom:8}}>Selecione a obra para cada dia da semana. Dias sem obra serão ignorados.</p>
                <div style={{display:"grid",gap:6}} id="di-lote-container">
                  {["Segunda","Terça","Quarta","Quinta","Sexta","Sábado"].map(function(dia,idx){return(
                    <div key={dia} style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:12,fontWeight:600,width:70,color:C.textMuted}}>{dia}</span>
                      <select id={"di-obra-"+idx} style={{...inputStyle,padding:"6px 10px",fontSize:11,flex:1}}>
                        <option value="">— Não trabalhou —</option>
                        {obrasAtivas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}
                      </select>
                    </div>
                  );})}
                </div>
                <button onClick={function(){
                  var eqId = document.getElementById("di-func").value;
                  var semanaRef = document.getElementById("di-semana").value;
                  if(!eqId || !semanaRef) return;
                  var baseDate = new Date(semanaRef+"T12:00:00");
                  var dow = baseDate.getDay();
                  var mondayOffset = dow === 0 ? -6 : 1 - dow;
                  var count = 0;
                  [0,1,2,3,4,5].forEach(function(idx){
                    var obraId = document.getElementById("di-obra-"+idx).value;
                    if(!obraId) return;
                    var d = new Date(baseDate);
                    d.setDate(baseDate.getDate() + mondayOffset + idx);
                    var dataStr = d.toISOString().slice(0,10);
                    fbAddDiaria({equipeId:eqId,obraId:obraId,data:dataStr});
                    count++;
                  });
                  if(count>0) showToast(count+" diárias registradas");
                }} style={{...btnPrimary,marginTop:12,width:"100%",justifyContent:"center",padding:"10px 0",fontSize:12}}>＋ Registrar Diárias da Semana</button>
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

  // ══════════════════════════════════════════════════════════════
  // PAGES RECUPERADAS (KPIs + Portais)
  // ══════════════════════════════════════════════════════════════

  // ── KPIs RECONSTRUÍDA ──
  const KPIsPage = () => {
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
                <TH>Obra</TH><TH align="right">Contrato</TH><TH align="right">Custo</TH><TH align="right">Lucro</TH><TH align="right">Margem</TH><TH align="right">Execução</TH><TH>Estado</TH>
              </tr></thead>
              <tbody>
                {obraKPIs.map(o=>(
                  <tr key={o.id} style={{opacity:o.semDadosReais?0.6:1}}>
                    <TD bold>{o.nome}</TD>
                    <TD mono align="right">{R$(o.contrato)}</TD>
                    <TD mono align="right" color={C.amber}>{R$(o.custo)}</TD>
                    <TD mono bold align="right" color={o.lucroBruto>=0?C.green:C.red}>{R$(o.lucroBruto)}</TD>
                    <TD mono bold align="right" color={o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red}>{o.semDadosReais?"—":pct(o.margem)}</TD>
                    <TD mono align="right">{pct(o.execucao)}</TD>
                    <TD>{o.semDadosReais?<Badge text="AGUARDANDO" color={C.amber} size="sm"/>:o.margem>=0.25?<Badge text="ÓTIMA" color={C.green} size="sm"/>:<Badge text="NORMAL" color={C.cyan} size="sm"/>}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
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
                  if(tot===0) return null;
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
      </div>
    );
  };

  // ── PORTAIS DOS CLIENTES (admin) ──
  const PortaisPage = () => {
    const portalNomesSet = new Set(Object.values(PORTAL_TOKENS));
    const clientesComPortal = clientes.filter(c => c.portalToken || portalNomesSet.has(c.nome));
    clientesComPortal.forEach(c => {
      if (!c.portalToken) {
        const entry = Object.entries(PORTAL_TOKENS).find(([,nome]) => nome === c.nome);
        if (entry) c.portalToken = entry[0];
      }
    });
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
            <p style={{fontSize:13,color:C.textDim,marginTop:4}}>{clientesComPortal.length} clientes com portal ativo · {aditivos.length} aditivos</p>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setModal({type:"portalForm"})} style={{...btnGhost,borderColor:C.gold+"44",color:C.gold}}>🔗 Criar Portal</button>
            <button onClick={()=>setModal({type:"docForm"})} style={btnGhost}>📎 Publicar Documento</button>
            <button onClick={()=>setModal({type:"aditivoForm"})} style={btnPrimary}>＋ Propor Aditivo</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14,marginBottom:24}}>
          {clientesComPortal.map(c=>{
            const ads = aditivos.filter(a=>a.cliente===c.nome);
            const adsPend = ads.filter(a=>a.status==="pendente").length;
            return (
              <div key={c.id} style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 22px",borderTop:`3px solid ${C.gold}`}}>
                <p style={{fontSize:15,fontWeight:800,letterSpacing:-0.3,marginBottom:8}}>{c.nome}</p>
                <p style={{fontSize:11,color:C.textDim,marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>Token: {c.portalToken}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <div><span style={{fontSize:10,color:C.textDim}}>CONTRATO</span><p style={{fontWeight:700,fontSize:13,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{R$(c.contrato)}</p></div>
                  <div><span style={{fontSize:10,color:C.textDim}}>ADITIVOS</span><p style={{fontWeight:700,fontSize:13,marginTop:2}}>{ads.length} {adsPend>0&&<span style={{color:C.amber,fontSize:10}}>({adsPend} pend.)</span>}</p></div>
                </div>
                <button onClick={()=>copyLink(c.portalToken,c.id)} style={{...btnGhost,width:"100%",justifyContent:"center",borderColor:copied===c.id?C.green:C.gold+"44",color:copied===c.id?C.green:C.gold}}>{copied===c.id?"✓ Copiado!":"📋 Copiar link do portal"}</button>
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
                  {isAdmin && <TH></TH>}
                </tr></thead>
                <tbody>
                  {aditivos.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(a=>(
                    <tr key={a.id}>
                      <TD>{fmtD(a.data)}</TD>
                      <TD bold>{a.cliente}</TD>
                      <TD color={C.textMuted}>{a.descricao}</TD>
                      <TD mono bold align="right">{R$(a.valor)}</TD>
                      <TD><Badge text={a.status} color={a.status==="aprovado"?C.green:a.status==="recusado"?C.red:C.amber} size="sm"/></TD>
                      {isAdmin && (
                        <TD>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>setModal({type:"aditivoEdit",aditivo:a})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button>
                            <button onClick={()=>{if(window.confirm(`Excluir aditivo "${a.descricao}"?`))fbDelAditivo(a.id);}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button>
                          </div>
                        </TD>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {(() => {
          const allDocs = Object.values(data.documentos || {});
          return allDocs.length > 0 && (
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden",marginTop:16}}>
              <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`}}>
                <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2}}>Documentos Publicados</p>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><TH>Cliente</TH><TH>Tipo</TH><TH>Título</TH><TH>Link</TH>{isAdmin&&<TH></TH>}</tr></thead>
                  <tbody>
                    {allDocs.map(d=>(
                      <tr key={d.id}>
                        <TD bold>{d.cliente}</TD>
                        <TD><Badge text={d.tipo} color={C.cyan} size="sm"/></TD>
                        <TD>{d.titulo}</TD>
                        <TD><a href={d.url} target="_blank" rel="noopener noreferrer" style={{color:C.gold,fontSize:12,textDecoration:"none"}}>📎 Abrir →</a></TD>
                        {isAdmin&&<TD><button onClick={()=>fbDelDoc(d.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></TD>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // NOVAS PAGES — MÓDULOS V3
  // ══════════════════════════════════════════════════════════════

  // ── TESOURARIA (item 2) — Fluxo de caixa real com saldo diário ──
  const TesourariaPage = () => {
    const [editSaldo,setEditSaldo] = useState(false);
    const [novoSaldo,setNovoSaldo] = useState(saldoInicial);

    // Construir fluxo diário: entradas (cobranças recebidas) - saídas (lançamentos pagos)
    const movimentos = [];
    cobs.filter(c=>c.status==="RECEBIDO").forEach(c=>movimentos.push({data:c.data,tipo:"entrada",desc:c.cliente,valor:c.valor||0,cat:"Cobrança"}));
    lancs.forEach(l=>movimentos.push({data:l.data,tipo:"saida",desc:l.descricao,valor:l.valor||0,cat:l.centroCusto||l.tipo}));
    movimentos.sort((a,b)=>(a.data||"").localeCompare(b.data||""));

    const totalEntradas = movimentos.filter(m=>m.tipo==="entrada").reduce((s,m)=>s+m.valor,0);
    const totalSaidas = movimentos.filter(m=>m.tipo==="saida").reduce((s,m)=>s+m.valor,0);
    const saldoAtual = saldoInicial + totalEntradas - totalSaidas;

    // Saldo por mês
    const mesesFluxo = [...new Set(movimentos.map(m=>m.data?.slice(0,7)).filter(Boolean))].sort();
    const fluxoPorMes = mesesFluxo.map(m=>{
      const ent = movimentos.filter(x=>x.data?.startsWith(m)&&x.tipo==="entrada").reduce((s,x)=>s+x.valor,0);
      const sai = movimentos.filter(x=>x.data?.startsWith(m)&&x.tipo==="saida").reduce((s,x)=>s+x.valor,0);
      return {mes:m,entradas:ent,saidas:sai,saldo:ent-sai};
    });

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>🏦 Tesouraria</h2>
          {editSaldo ? (
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:12,color:C.textDim}}>Saldo inicial:</span>
              <input type="number" value={novoSaldo} onChange={e=>setNovoSaldo(e.target.value)} style={{...inputStyle,width:140,padding:"6px 12px"}}/>
              <button onClick={()=>{fbSaveSaldoInicial(parseFloat(novoSaldo)||0);setEditSaldo(false);}} style={{...btnPrimary,padding:"8px 14px",fontSize:12}}>Salvar</button>
            </div>
          ) : (
            <button onClick={()=>setEditSaldo(true)} style={btnGhost}>✏️ Saldo inicial: {R$(saldoInicial)}</button>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:20}}>
          <MetricCard label="Saldo Atual" value={R$(saldoAtual)} color={saldoAtual>=0?C.green:C.red} sub="Saldo inicial + entradas - saídas"/>
          <MetricCard label="Total Entradas" value={R$(totalEntradas)} color={C.green} sub={movimentos.filter(m=>m.tipo==="entrada").length+" recebimentos"}/>
          <MetricCard label="Total Saídas" value={R$(totalSaidas)} color={C.red} sub={movimentos.filter(m=>m.tipo==="saida").length+" pagamentos"}/>
          <MetricCard label="Saldo Inicial" value={R$(saldoInicial)} color={C.accent}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(fluxoPorMes.length,6)},1fr)`,gap:10,marginBottom:20}}>
          {fluxoPorMes.map(f=>(
            <div key={f.mes} style={{background:C.surface,borderRadius:12,padding:"16px 18px",border:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>{f.mes.replace("-","/")}</p>
              <p style={{fontSize:18,fontWeight:800,color:f.saldo>=0?C.green:C.red,marginTop:6,fontFamily:"'JetBrains Mono',monospace"}}>{R$(f.saldo)}</p>
              <div style={{marginTop:8,fontSize:10,color:C.textMuted}}>
                <span style={{color:C.green}}>↑{R$(f.entradas)}</span>
                <span style={{marginLeft:8,color:C.red}}>↓{R$(f.saidas)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
          <div style={{overflowX:"auto",maxHeight:500}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead style={{position:"sticky",top:0,background:C.surface,zIndex:1}}><tr>
                <TH>Data</TH><TH>Tipo</TH><TH>Descrição</TH><TH>Categoria</TH><TH align="right">Valor</TH>
              </tr></thead>
              <tbody>
                {movimentos.slice().reverse().slice(0,100).map((m,i)=>(
                  <tr key={i}>
                    <TD>{fmtD(m.data)}</TD>
                    <TD><Badge text={m.tipo==="entrada"?"ENTRADA":"SAÍDA"} color={m.tipo==="entrada"?C.green:C.red} size="sm"/></TD>
                    <TD bold>{m.desc}</TD>
                    <TD color={C.textDim}>{m.cat}</TD>
                    <TD mono bold align="right" color={m.tipo==="entrada"?C.green:C.red}>{m.tipo==="entrada"?"+":"-"}{R$(m.valor)}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── RDO DIGITAL (item 6) ──
  const RdoPage = () => {
    const [filtroObra,setFiltroObra] = useState("todos");
    const rdosFilt = filtroObra==="todos" ? rdos : rdos.filter(r=>r.obraId===filtroObra);
    const rdosSort = [...rdosFilt].sort((a,b)=>(b.data||"").localeCompare(a.data||""));

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>📋 RDO Digital</h2>
            <p style={{fontSize:13,color:C.textDim,marginTop:4}}>{rdos.length} relatórios registrados</p>
          </div>
          {canEdit && <button onClick={()=>setModal({type:"rdoForm"})} style={btnPrimary}>＋ Novo RDO</button>}
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={()=>setFiltroObra("todos")} style={{...btnGhost,borderColor:filtroObra==="todos"?C.accent:C.border,color:filtroObra==="todos"?C.accent:C.textMuted}}>Todas</button>
          {obrasAtivas.map(o=>(
            <button key={o.id} onClick={()=>setFiltroObra(o.id)} style={{...btnGhost,borderColor:filtroObra===o.id?C.accent:C.border,color:filtroObra===o.id?C.accent:C.textMuted,fontSize:11}}>{o.nome.replace("OBRA ","")}</button>
          ))}
        </div>

        <div style={{display:"grid",gap:12}}>
          {rdosSort.map(r=>{
            const ob = obras.find(o=>o.id===r.obraId);
            const fotos = Array.isArray(r.fotos) ? r.fotos.filter(function(x){return x}) : [];
            const rdoNum = rdos.filter(function(x){return x.obraId===r.obraId}).sort(function(a,b){return(a.data||"").localeCompare(b.data||"")}).findIndex(function(x){return x.id===r.id})+1;
            const gerarPdf = function() {
              var obraNome = ob ? ob.nome : "";
              var dataFmt = fmtD(r.data);
              var diasSemana = ["Domingo","Segunda-Feira","Ter\u00e7a-Feira","Quarta-Feira","Quinta-Feira","Sexta-Feira","S\u00e1bado"];
              var dObj = new Date(r.data+"T12:00:00");
              var diaSem = diasSemana[dObj.getDay()] || "";
              var ativs = (r.atividades||"").split("\n").filter(function(x){return x.trim()});
              var h='<!DOCTYPE html><html><head><title>RDO</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#000;padding:20px 30px;max-width:800px;margin:0 auto;font-size:12px}';
              h+='.ph{display:flex;justify-content:space-between;font-size:10px;margin-bottom:8px}.ap{background:#0B1A3B;color:#fff;padding:3px 12px;font-weight:700;font-size:10px}';
              h+='.lb{text-align:center;padding:12px;border:1px solid #ccc}.lt{font-size:22px;font-weight:900;letter-spacing:6px;color:#0B1A3B}';
              h+='h1{font-size:14px;font-weight:700;text-align:center;padding:8px;border:1px solid #ccc;border-top:none}';
              h+='table{width:100%;border-collapse:collapse}td,th{padding:6px 10px;border:1px solid #ccc;font-size:11px;vertical-align:top}th{background:#f5f5f5;font-weight:700;text-align:left}';
              h+='.sh{background:#f0f0f0;font-weight:700;padding:6px 10px;border:1px solid #ccc;font-size:11px}';
              h+='.fg{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc}.fc{border:1px solid #ccc;padding:4px;text-align:center}.fc img{width:100%;max-height:320px;object-fit:cover}';
              h+='.as{display:flex;justify-content:space-between;margin-top:60px}.as div{text-align:center;width:45%}.al{border-top:1px solid #000;padding-top:4px;font-size:11px;margin-top:40px}';
              h+='@page{margin:15mm 12mm}@media print{body{padding:0}}</style></head><body>';
              h+='<div class="ph"><span>RDO n\u00b0 '+rdoNum+' - '+dataFmt+'</span><span class="ap">Aprovado</span></div>';
              h+='<div class="lb"><div class="lt">F E L T</div></div><h1>Relat\u00f3rio Di\u00e1rio de Obra (RDO)</h1>';
              h+='<table><tr><th>N\u00b0</th><td>'+rdoNum+'</td><th>Data</th><td>'+dataFmt+'</td><th>Dia</th><td>'+diaSem+'</td></tr>';
              h+='<tr><th>Obra</th><td colspan="5">'+obraNome+'</td></tr></table>';
              h+='<table style="margin-top:12px"><tr><th>Equipe presente</th></tr><tr><td>'+(r.equipePres||"-")+'</td></tr></table>';
              h+='<table style="margin-top:12px"><tr><td class="sh" colspan="2">Atividades</td></tr>';
              ativs.forEach(function(a){h+='<tr><td style="padding:6px 12px">- '+a.trim()+'</td><td style="width:120px;text-align:center">Em Andamento</td></tr>';});
              if(!ativs.length)h+='<tr><td colspan="2">-</td></tr>';
              h+='</table>';
              if(r.materiaisRecebidos){h+='<table style="margin-top:12px"><tr><td class="sh">Materiais Recebidos</td></tr><tr><td>'+r.materiaisRecebidos+'</td></tr></table>';}
              if(r.ocorrencias){h+='<table style="margin-top:12px"><tr><td class="sh">Ocorr\u00eancias</td></tr><tr><td style="background:#fff8e1">'+r.ocorrencias.replace(/\n/g,"<br>")+'</td></tr></table>';}
              if(fotos.length>0){h+='<div style="margin-top:12px"><div class="sh" style="border:1px solid #ccc">Fotos ('+fotos.length+')</div></div><div class="fg">';fotos.forEach(function(f2){h+='<div class="fc"><img src="'+f2+'"/></div>';});if(fotos.length%2!==0)h+='<div class="fc"></div>';h+='</div>';}
              h+='<div class="as"><div><div class="al">Assinatura</div></div><div><div class="al">Assinatura</div></div></div></body></html>';
              var w2=window.open("","_blank");w2.document.write(h);w2.document.close();setTimeout(function(){w2.print();},800);
            };
            return (
              <div key={r.id} style={{background:C.surface,borderRadius:16,border:"1px solid "+C.border,padding:"20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div>
                    <p style={{fontSize:15,fontWeight:800}}>{fmtD(r.data)} — {ob?ob.nome:"—"}</p>
                    {fotos.length>0 && <Badge text={fotos.length+" fotos"} color={C.purple} size="sm"/>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={gerarPdf} style={{...btnGhost,fontSize:11,padding:"6px 12px"}}>📄 PDF</button>
                    {canEdit && <button onClick={function(){if(window.confirm("Excluir este RDO?"))fbDelRdo(r.id);}} style={{...btnGhost,fontSize:11,padding:"6px 12px",borderColor:C.red+"44",color:C.red}}>🗑️</button>}
                  </div>
                </div>
                {r.equipePres && <p style={{fontSize:12,color:C.textMuted,marginBottom:6}}>👷 {r.equipePres}</p>}
                <p style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:8,whiteSpace:"pre-line"}}>{r.atividades}</p>
                {r.ocorrencias && <p style={{fontSize:12,color:C.amber,marginBottom:6}}>⚠️ {r.ocorrencias}</p>}
                {r.materiaisRecebidos && <p style={{fontSize:12,color:C.textDim,marginBottom:6}}>📦 {r.materiaisRecebidos}</p>}
                {fotos.length > 0 && (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:6,marginTop:10}}>
                    {fotos.map(function(f2,i2){return(
                      <a key={i2} href={f2} target="_blank" rel="noopener noreferrer" style={{display:"block",borderRadius:8,overflow:"hidden",border:"1px solid "+C.border,aspectRatio:"1"}}>
                        <img src={f2} alt={"Foto "+(i2+1)} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
                      </a>
                    );})}
                  </div>
                )}
              </div>
            );
          })}
          {rdosSort.length === 0 && (
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"40px",textAlign:"center"}}>
              <p style={{color:C.textDim,fontSize:13}}>Nenhum RDO registrado. Clique em "＋ Novo RDO" para começar.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── COMPRAS (item 7) ──
  const ComprasPage = () => {
    const comprasSort = [...compras].sort((a,b)=>(b.data||"").localeCompare(a.data||""));
    const totalCompras = compras.reduce((s,c)=>s+(c.valorTotal||0),0);
    const fornecedores = [...new Set(compras.map(c=>c.fornecedor).filter(Boolean))];

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>🛒 Compras</h2>
            <p style={{fontSize:13,color:C.textDim,marginTop:4}}>{compras.length} compras · {fornecedores.length} fornecedores · {R$(totalCompras)}</p>
          </div>
          {canEdit && <button onClick={()=>setModal({type:"compraForm"})} style={btnPrimary}>＋ Registrar Compra</button>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
          <MetricCard small label="Total Compras" value={R$(totalCompras)} color={C.amber}/>
          <MetricCard small label="Fornecedores" value={fornecedores.length+""} color={C.accent}/>
          <MetricCard small label="Ticket Médio" value={compras.length?R$(totalCompras/compras.length):"—"} color={C.purple}/>
        </div>

        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                <TH>Data</TH><TH>Item</TH><TH>Fornecedor</TH><TH>Obra</TH><TH align="right">Qtd</TH><TH align="right">V.Unit</TH><TH align="right">Total</TH><TH>NF</TH>
                {isAdmin && <TH></TH>}
              </tr></thead>
              <tbody>
                {comprasSort.map(c=>{
                  const ob = obras.find(o=>o.id===c.obraId);
                  return (
                    <tr key={c.id}>
                      <TD>{fmtD(c.data)}</TD>
                      <TD bold>{c.item}</TD>
                      <TD color={C.textMuted}>{c.fornecedor||"—"}</TD>
                      <TD><Badge text={ob?.nome?.replace("OBRA ","")||"Geral"} color={C.cyan} size="sm"/></TD>
                      <TD mono align="right">{c.quantidade} {c.unidade}</TD>
                      <TD mono align="right">{R$(c.valorUnitario)}</TD>
                      <TD mono bold align="right" color={C.amber}>{R$(c.valorTotal)}</TD>
                      <TD color={C.textDim}>{c.nfFornecedor||"—"}</TD>
                      {isAdmin && <TD><button onClick={()=>fbDelCompra(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></TD>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── MEDIÇÕES (item 5) ──
  const MedicoesPage = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>📐 Medições</h2>
          <p style={{fontSize:13,color:C.textDim,marginTop:4}}>{medicoes.length} medições registradas</p>
        </div>
        {isAdmin && <button onClick={()=>setModal({type:"medicaoForm"})} style={btnPrimary}>＋ Nova Medição</button>}
      </div>

      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <TH>#</TH><TH>Data</TH><TH>Obra</TH><TH>Cliente</TH><TH align="right">%</TH><TH align="right">Valor</TH><TH>Descrição</TH>
            </tr></thead>
            <tbody>
              {[...medicoes].sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(m=>{
                const ob = obras.find(o=>o.id===m.obraId);
                return (
                  <tr key={m.id}>
                    <TD bold color={C.accent}>#{m.numero}</TD>
                    <TD>{fmtD(m.data)}</TD>
                    <TD bold>{ob?.nome||"—"}</TD>
                    <TD color={C.textMuted}>{m.cliente}</TD>
                    <TD mono bold align="right" color={C.green}>{m.percentual}%</TD>
                    <TD mono bold align="right">{R$(m.valorMedicao)}</TD>
                    <TD color={C.textDim}>{m.descricao||"—"}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {medicoes.length === 0 && (
        <div style={{textAlign:"center",padding:"40px 0",color:C.textDim}}>
          <p>Nenhuma medição registrada. Medições geram cobranças automaticamente.</p>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // RENDER PAGE SWITCH — ATUALIZADO COM NOVOS MÓDULOS
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
      case "tesouraria": return <TesourariaPage/>;
      case "rdo": return <RdoPage/>;
      case "compras": return <ComprasPage/>;
      case "medicoes": return <MedicoesPage/>;
      default: return <DashPage/>;
    }
  };

  // ══════════════════════════════════════════════════════════════
  // NAVEGAÇÃO ATUALIZADA
  // ══════════════════════════════════════════════════════════════
  const navItems = isDiarista
    ? [{id:"funcionarios",label:"Equipe",emoji:"👷"}]
    : isEstagiario
    ? [
        {id:"obras",label:"Obras",emoji:"🏗️"},
        {id:"rdo",label:"RDO",emoji:"📋"},
        {id:"compras",label:"Compras",emoji:"🛒"},
        {id:"funcionarios",label:"Equipe",emoji:"👷"},
        {id:"operacional",label:"Operacional",emoji:"⛽"},
      ]
    : [
        {id:"dashboard",label:"Dashboard",emoji:"📊"},
        {id:"obras",label:"Obras",emoji:"🏗️"},
        {id:"faturamento",label:"Faturamento",emoji:"💰"},
        {id:"tesouraria",label:"Tesouraria",emoji:"🏦"},
        {id:"medicoes",label:"Medições",emoji:"📐"},
        {id:"compras",label:"Compras",emoji:"🛒"},
        {id:"funcionarios",label:"Equipe",emoji:"👷"},
        {id:"rdo",label:"RDO",emoji:"📋"},
        {id:"operacional",label:"Operacional",emoji:"⛽"},
        {id:"administrativo",label:"Admin",emoji:"💼"},
        {id:"kpis",label:"KPIs",emoji:"🎯"},
        {id:"portais",label:"Portais",emoji:"🔑"},
        {id:"historico",label:"Histórico",emoji:"📝"}
      ];

  // ══════════════════════════════════════════════════════════════
  // MAIN LAYOUT — RESPONSIVO (item 8)
  // ══════════════════════════════════════════════════════════════
  const [isMobile,setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(function(){
    var handler = function(){ setIsMobile(window.innerWidth < 768); };
    window.addEventListener("resize",handler);
    return function(){ window.removeEventListener("resize",handler); };
  },[]);

  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'SF Pro Display','Inter',system-ui,sans-serif"}}>

      {/* SIDEBAR — desktop */}
      {!isMobile && (
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
              border:`1px solid ${C.gold}44`,
              flexShrink:0
            }}><FeltLogo size={26}/></div>
            {!sideCollapsed && (
              <div>
                <p style={{fontSize:13,fontWeight:800,letterSpacing:-0.3}}>Felt</p>
                <p style={{fontSize:9,color:C.textDim,letterSpacing:1,textTransform:"uppercase"}}>Engenharia</p>
              </div>
            )}
          </div>

          <nav style={{flex:1,display:"flex",flexDirection:"column",gap:3,overflowY:"auto"}}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>setPage(item.id)} style={{
                display:"flex",alignItems:"center",gap:12,
                padding:sideCollapsed?"11px 0":"11px 14px",borderRadius:10,border:"none",
                background:page===item.id?C.accentGlow:"transparent",
                color:page===item.id?C.accent:C.textMuted,cursor:"pointer",fontSize:13,
                fontWeight:page===item.id?700:500,textAlign:"left",transition:"all 0.2s",
                justifyContent:sideCollapsed?"center":"flex-start",
                borderLeft:page===item.id&&!sideCollapsed?`3px solid ${C.accent}`:"3px solid transparent"
              }} onMouseEnter={e=>{if(page!==item.id)e.currentTarget.style.color=C.text;}} onMouseLeave={e=>{if(page!==item.id)e.currentTarget.style.color=C.textMuted;}}>
                <span style={{fontSize:15}}>{item.emoji}</span>
                {!sideCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div style={{paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            {!sideCollapsed ? (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px"}}>
                <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.gold},${C.accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#000"}}>{user.avatar}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.nome}</p>
                  <p style={{fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:0.8}}>{user.role}</p>
                </div>
                <button onClick={()=>setUser(null)} title="Sair" style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:16,padding:6}}>↗</button>
              </div>
            ) : (
              <button onClick={()=>setUser(null)} title="Sair" style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:16,padding:"10px 0",width:"100%"}}>↗</button>
            )}
            {isAdmin && !sideCollapsed && (
              <button onClick={()=>{
                const backup = JSON.stringify(data, null, 2);
                const blob = new Blob([backup], {type:"application/json"});
                const url2 = URL.createObjectURL(blob);
                const a2 = document.createElement("a");
                a2.href = url2; a2.download = `felt-erp-backup-${new Date().toISOString().slice(0,10)}.json`;
                a2.click(); URL.revokeObjectURL(url2);
                set(ref(fdb,`backups/${new Date().toISOString().slice(0,10)}`),{timestamp:new Date().toISOString(),usuario:user.nome,dados:data});
                showToast("Backup salvo e exportado");
              }} style={{width:"100%",background:C.bg,border:`1px solid ${C.gold}33`,color:C.gold,padding:"8px 0",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,marginTop:6}}>💾 Exportar Backup</button>
            )}
            <button onClick={()=>setSideCollapsed(!sideCollapsed)} style={{width:"100%",background:"none",border:`1px solid ${C.border}`,color:C.textDim,padding:"6px 0",borderRadius:8,cursor:"pointer",fontSize:14,marginTop:8}}>{sideCollapsed?"→":"←"}</button>
          </div>
        </aside>
      )}

      {/* MOBILE NAV — bottom tabs (item 8) */}
      {isMobile && (
        <div style={{
          position:"fixed",top:0,left:0,right:0,zIndex:100,
          background:`linear-gradient(180deg,${C.surface},${C.surfaceAlt})`,
          borderBottom:`1px solid ${C.border}`,
          padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.navy},${C.navyLight})`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.gold}44`}}>
              <FeltLogo size={20}/>
            </div>
            <span style={{fontSize:14,fontWeight:800}}>Felt ERP</span>
          </div>
          <button onClick={()=>setMobileNav(!mobileNav)} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer"}}>{mobileNav?"✕":"☰"}</button>
        </div>
      )}
      {isMobile && mobileNav && (
        <div style={{position:"fixed",top:56,left:0,right:0,bottom:0,zIndex:99,background:C.surface+"f5",backdropFilter:"blur(12px)",padding:"16px",overflowY:"auto"}} onClick={()=>setMobileNav(false)}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{setPage(item.id);setMobileNav(false);}} style={{
              display:"flex",alignItems:"center",gap:12,width:"100%",padding:"14px 16px",borderRadius:12,border:"none",
              background:page===item.id?C.accentGlow:"transparent",color:page===item.id?C.accent:C.textMuted,
              cursor:"pointer",fontSize:15,fontWeight:page===item.id?700:500,textAlign:"left",marginBottom:4
            }}>
              <span style={{fontSize:18}}>{item.emoji}</span><span>{item.label}</span>
            </button>
          ))}
          <div style={{borderTop:`1px solid ${C.border}`,marginTop:12,paddingTop:12}}>
            <button onClick={()=>setUser(null)} style={{...btnGhost,width:"100%",justifyContent:"center"}}>↗ Sair</button>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main style={{flex:1,padding:isMobile?"72px 16px 24px":"36px 44px",overflow:"auto",minWidth:0}}>
        {renderPage()}
      </main>

      {/* FAB — Lançamento Rápido (item 8 mobile) */}
      {isMobile && canEdit && (
        <button onClick={()=>setModal({type:"lancForm",tipo:"obra"})} style={{
          position:"fixed",bottom:24,right:24,zIndex:100,
          width:56,height:56,borderRadius:28,border:"none",
          background:`linear-gradient(135deg,${C.gold},${C.accentDark})`,
          color:"#000",fontSize:24,fontWeight:900,cursor:"pointer",
          boxShadow:`0 8px 24px ${C.gold}44`,display:"flex",alignItems:"center",justifyContent:"center"
        }}>＋</button>
      )}

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
      {modal?.type === "aditivoEdit" && <AditivoEditForm initial={modal.aditivo} onClose={()=>setModal(null)}/>}
      {modal?.type === "docForm" && <DocForm onClose={()=>setModal(null)}/>}
      {modal?.type === "portalForm" && <PortalForm onClose={()=>setModal(null)}/>}
      {modal?.type === "rdoForm" && <RdoForm onClose={()=>setModal(null)}/>}
      {modal?.type === "compraForm" && <CompraForm onClose={()=>setModal(null)}/>}
      {modal?.type === "medicaoForm" && <MedicaoForm onClose={()=>setModal(null)}/>}

      {/* TOAST */}
      {toast && (
        <div style={{
          position:"fixed",bottom:isMobile?90:30,right:isMobile?16:30,
          background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,
          border:`1px solid ${C.gold}44`,color:C.text,padding:"14px 22px",borderRadius:12,
          fontSize:13,fontWeight:600,boxShadow:`0 16px 40px rgba(0,0,0,0.5)`,zIndex:300,animation:"slideUp 0.3s ease"
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
    @media (max-width: 768px) {
      .side-desktop { display: none !important; }
      main { padding: 72px 16px 80px !important; }
    }
  `;
  document.head.appendChild(style);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
