import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, update, remove } from "firebase/database";

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
const FAT_STATUS_COLOR = {RECEBIDO:"#00c48c","A VENCER":"#00b4d8",PROXIMO:"#f0a500",VENCIDO:"#ff5a5a"};
// Obra-Cliente matching map for cross-referencing custos with faturamento
const OBRA_CLIENTE_MAP={"o1":["HL 227"],"o2":["LIVING DUETT","DUETT"],"o3":["EPICO 154","ANALICE"],"o4":["NAU KLABIN APT 1607","NAU 1607"],"o5":["LANDMARK APT 202","LANDMARK"]};
const USERS = [
  { username:"leonardo", password:"felt2026", role:"admin", nome:"Leonardo Felt", avatar:"LF" },
  { username:"salles", password:"salles2026", role:"admin", nome:"Salles Paulo", avatar:"SP" },
  { username:"tiago", password:"tiago123", role:"viewer", nome:"Tiago Engenheiro", avatar:"TE" },
  { username:"rafael", password:"felt2026", role:"diarista", nome:"Rafael", avatar:"RF" },
];

// ─── SEED ───
const buildSeed = () => {
  const obras = {
    o1:{id:"o1",nome:"OBRA HL 227",contrato:120000,aliquota:0,rt:0,status:"Em andamento"},
    o2:{id:"o2",nome:"OBRA DUETT 126",contrato:81000,aliquota:0,rt:0,status:"Em andamento"},
    o3:{id:"o3",nome:"OBRA ÉPICO 154",contrato:140000,aliquota:0,rt:0,status:"Em andamento"},
    o4:{id:"o4",nome:"OBRA NAU 1607",contrato:132000,aliquota:0.07,rt:0.04773,status:"Em andamento"},
    o5:{id:"o5",nome:"OBRA LANDMARK",contrato:148000,aliquota:0,rt:0.05,status:"Em andamento"},
  };
  const L={};let n=1;
  const a=(oid,d,v,dt,cc,ob="",t="obra")=>{const id="s"+(n++);L[id]={id,obraId:oid||"",descricao:d,valor:v,data:dt,centroCusto:cc,obs:ob,tipo:t};};
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
  a("o4","MÃO DE OBRA CIVIL - NOEL",56000,"2026-03-03","MÃO DE OBRA");
  a("o4","PAPELÃO ONDULADO",1091.25,"2026-02-19","MATERIAL");
  a("o4","EMISSÃO DE ART",285.59,"2026-03-03","ADMINISTRATIVO");
  a("o4","EMISSÃO DE NF (IMPOSTO)",2590,"2026-03-03","IMPOSTO");
  a("o4","PAGAMENTO RT - ORAZI",6300,"2026-03-03","RT");
  a("o4","MATERIAL DRYWALL",3961,"2026-03-04","MATERIAL");
  a("o4","FRETE DESCARGA DRYWALL",250,"2026-03-05","TRANSPORTE/FRETES");
  a("o5","PAPELÃO ONDULADO",1091.25,"2026-02-19","MATERIAL");
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
  let cn=1;
  const cl=(nome,ano,contrato,pago,status)=>{const id="cl"+(cn++);clientes[id]={id,nome,ano,contrato,pagoPre:pago,status};};
  cl("JOAO DE LUCA",2024,11000,11000,"QUITADO");cl("PERDIZES 61B",2024,250000,250000,"QUITADO");cl("FRUTARIA",2024,115000,115000,"QUITADO");cl("OBRA MATHEUS",2024,55000,55000,"QUITADO");
  cl("OBRA LUIZ",2025,55000,55000,"QUITADO");cl("OBRA ESTRUTURA",2025,32000,32000,"QUITADO");cl("ADITIVO PERDIZES",2025,15000,0,"EM ANDAMENTO");cl("CONNECT 1",2025,83000,66400,"EM ATRASO");
  cl("HL 156",2025,45000,45000,"QUITADO");cl("HL 143",2025,51000,51000,"QUITADO");cl("HL 173",2025,62000,62000,"QUITADO");cl("HL 144",2025,30000,30000,"QUITADO");
  cl("HL 106",2025,55000,55000,"QUITADO");cl("HL 132",2025,52000,38500,"QUITADO");cl("HL 224",2025,65000,58925,"QUITADO");cl("HL 223",2025,61000,60000,"QUITADO");
  cl("HL 177",2025,90000,78750,"EM ANDAMENTO");cl("CONNECT 2",2025,75000,75000,"QUITADO");cl("CONNECT 3",2025,70000,70000,"QUITADO");cl("HL 216",2025,65000,55250,"EM ANDAMENTO");
  cl("HL 141",2025,3500,3500,"QUITADO");cl("NAU",2025,82000,73710,"EM ANDAMENTO");cl("ADITIVO HL 143",2025,800,800,"QUITADO");cl("EPICO 54 MAIARA",2025,70000,50000,"EM ANDAMENTO");
  cl("EPICO 81 CAIQUE",2025,140000,80000,"EM ANDAMENTO");cl("VIVAZ CLARISSE",2025,43000,32000,"QUITADO");cl("HL 218",2025,58700,47700,"EM ANDAMENTO");cl("HL 148",2025,116000,110200,"EM ANDAMENTO");
  cl("BY YOO - MOEMA",2025,307000,224000,"EM ANDAMENTO");cl("HL 166",2025,63000,48910,"EM ANDAMENTO");cl("HL 58",2025,80000,57500,"EM ANDAMENTO");cl("ADITIVO HL 132",2025,700,700,"QUITADO");
  cl("HL 164",2025,61000,43000,"EM ATRASO");cl("HL 211",2025,60000,53925,"EM ANDAMENTO");cl("HL 227",2026,120260,0,"EM ANDAMENTO");cl("LIVING DUETT - MOOCA",2026,81000,0,"EM ANDAMENTO");
  cl("LANDMARK APT 202",2026,148000,35000,"EM ANDAMENTO");cl("EPICO 154 - ANALICE",2026,140000,0,"EM ANDAMENTO");cl("NAU KLABIN APT 1607",2026,132000,0,"EM ANDAMENTO");
  cl("PROJETO CHINES",2026,20000,6000,"EM ANDAMENTO");cl("EPICO 263 EDSON",2026,370000,0,"EM ANDAMENTO");cl("LANDMARK 138 CLEITO",2026,134000,0,"EM ANDAMENTO");cl("PARK VIEW - FERNANDO TANII",2026,420000,0,"EM ANDAMENTO");
  // ─── COBRANÇAS (agenda de pagamentos) ───
  const cobrancas = {};
  let cb=1;
  const co=(data,cliente,valor,status,obs="")=>{const id="cb"+(cb++);cobrancas[id]={id,data,cliente,valor,status,obs};};
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
  // Abril (corrected from spreadsheet)
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
  let nfn=1;
  const nf=(data,cliente,valor)=>{const id="nf"+(nfn++);nfs[id]={id,data,cliente,valor};};
  nf("2024-07-01","JOAO DE LUCA",11500);nf("2025-01-07","MANSUR",4000);nf("2025-02-14","FRUTARIA IPIRANGA",30000);nf("2025-02-19","PERDIZES 61B",20000);
  nf("2025-03-11","OBRA ESTRUTURA",31972);nf("2025-03-18","PERDIZES 61B",20000);nf("2025-05-12","PERDIZES 61B",20000);nf("2025-08-13","HL 144",30000);
  nf("2025-09-04","HL 177",27000);nf("2025-10-27","HL 106",55250);nf("2025-11-13","HL 164",20000);nf("2025-11-13","HL 177",50000);
  nf("2026-01-08","VIVAZ CLARISSE",43000);nf("2026-02-26","NAU KLABIN 1607",37000);nf("2026-04-07","NAU KLABIN 1607",22500);
  // ─── EQUIPE (cadastro de funcionários) ───
  const equipe = {};
  let en=1;
  const eq=(nome,funcao,tipo,valorDiaria,salario=0)=>{const id="eq"+(en++);equipe[id]={id,nome,funcao,tipo,valorDiaria:valorDiaria||0,salario:salario||0,ativo:true};};
  // Mensalistas
  eq("TIAGO","ENGENHEIRO","mensalista",0,4500);eq("STEFANI","ADMINISTRATIVO","mensalista",0,2000);eq("RAFAEL","ENGENHEIRO","mensalista",0,3500);eq("NOEL","MESTRE DE OBRAS","mensalista",0,5000);
  // Diaristas
  eq("ALLEF","AJUDANTE","diarista",150);eq("CARLOS","PEDREIRO","diarista",250);eq("JONAS","PEDREIRO","diarista",250);eq("WELLINGTON","AJUDANTE","diarista",150);
  eq("RENAN","ELETRICISTA","diarista",300);eq("DIEGO","ENCANADOR","diarista",280);eq("MARCOS","SERVENTE","diarista",130);eq("LUCAS","AJUDANTE","diarista",150);
  // ─── DIÁRIAS (registro de presença) ───
  const diarias = {};
  let dn=1;
  const di=(eqId,obraId,data)=>{const id="di"+(dn++);diarias[id]={id,equipeId:eqId,obraId,data};};
  // Exemplo: Março 2026 - algumas diárias
  di("eq5","o1","2026-03-03");di("eq5","o1","2026-03-04");di("eq5","o1","2026-03-05");di("eq5","o4","2026-03-06");di("eq5","o4","2026-03-07");
  di("eq6","o4","2026-03-03");di("eq6","o4","2026-03-04");di("eq6","o4","2026-03-05");di("eq6","o4","2026-03-06");di("eq6","o3","2026-03-07");
  di("eq7","o3","2026-03-03");di("eq7","o3","2026-03-04");di("eq7","o1","2026-03-05");di("eq7","o1","2026-03-06");di("eq7","o1","2026-03-07");
  di("eq8","o1","2026-03-03");di("eq8","o4","2026-03-04");di("eq8","o4","2026-03-05");di("eq8","o3","2026-03-06");di("eq8","o3","2026-03-07");
  return {obras,lancamentos:L,clientes,cobrancas,nfs,equipe,diarias};
};

// ─── UTILS ───
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const R$=v=>(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const pct=v=>((v||0)*100).toFixed(1)+"%";
const fmtD=d=>{if(!d)return"—";const p=d.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:"—";};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const C={bg:"#060b14",surface:"#0c1322",surfaceAlt:"#111a2e",border:"#1a2540",borderHover:"#2a3d65",text:"#edf0f7",textMuted:"#8494b2",textDim:"#4d5f80",accent:"#c9a84c",accentDark:"#a88a35",accentGlow:"rgba(201,168,76,0.12)",green:"#34d399",red:"#f87171",amber:"#fbbf24",purple:"#a78bfa",cyan:"#22d3ee",navy:"#0B1A3B",gold:"#c9a84c"};
const palette=["#c9a84c","#a78bfa","#34d399","#22d3ee","#f87171","#ec4899","#6366f1","#14b8a6","#fbbf24","#f97316"];

// ─── PREMIUM COMPONENTS ───
const MetricCard=({label,value,color,sub,small,icon})=>(<div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:small?"18px 20px":"24px 26px",position:"relative",overflow:"hidden",transition:"all 0.3s cubic-bezier(.4,0,.2,1)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=color+"55";e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 24px ${color}15`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}><div style={{position:"absolute",top:-20,right:-20,width:100,height:100,background:`radial-gradient(circle,${color}10,transparent 70%)`,borderRadius:"50%"}}/>{icon&&<div style={{fontSize:20,marginBottom:8,opacity:0.6}}>{icon}</div>}<p style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{label}</p><p style={{fontSize:small?22:30,fontWeight:800,color:color||C.text,letterSpacing:-1.2,lineHeight:1}}>{value}</p>{sub&&<p style={{fontSize:11,color:C.textMuted,marginTop:8,lineHeight:1.3}}>{sub}</p>}</div>);
const ProgressBar=({value,max,color,height=6})=>(<div style={{background:C.bg,borderRadius:height,height,width:"100%",overflow:"hidden"}}><div style={{height:"100%",borderRadius:height,width:`${clamp((value/max)*100,0,100)}%`,background:`linear-gradient(90deg,${color},${color}aa)`,transition:"width 0.8s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 8px ${color}33`}}/></div>);
const Badge=({text,color})=>(<span style={{display:"inline-block",padding:"4px 12px",borderRadius:20,fontSize:10,fontWeight:700,background:color+"15",color,border:`1px solid ${color}30`,letterSpacing:0.5,textTransform:"uppercase"}}>{text}</span>);
const Donut=({segments,size=160,label})=>{const total=segments.reduce((s,x)=>s+x.value,0);if(!total)return null;const r=52,cx=65,cy=65,sw=14,circ=2*Math.PI*r;let off=0;return(<svg width={size} height={size} viewBox="0 0 130 130"><circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={sw} opacity="0.4"/>{segments.filter(s=>s.value>0).map((s,i)=>{const d=(s.value/total)*circ;const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${d} ${circ-d}`} strokeDashoffset={-off} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 4px ${s.color}44)`}}/>;off+=d;return el;})}<text x={cx} y={cy-2} textAnchor="middle" style={{fontSize:13,fontWeight:800,fill:C.text}}>{R$(total).replace("R$\u00a0","")}</text>{label&&<text x={cx} y={cy+14} textAnchor="middle" style={{fontSize:9,fill:C.textDim}}>{label}</text>}</svg>);};
const Spark=({data,color=C.accent,w=120,h=36})=>{if(!data||!data.length)return null;const max=Math.max(...data,1),min=Math.min(...data,0),range=max-min||1;const pts=data.map((v,i)=>`${(i/(data.length-1||1))*w},${h-((v-min)/range)*h}`).join(" ");return(<svg width={w} height={h} style={{display:"block"}}><defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#spg)"/><polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{filter:`drop-shadow(0 0 3px ${color}55)`}}/></svg>);};
const TH=({children,align})=>(<th style={{textAlign:align||"left",padding:"14px 16px",borderBottom:`2px solid ${C.border}`,color:C.textDim,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,whiteSpace:"nowrap",background:C.bg+"88"}}>{children}</th>);
const TD=({children,mono,bold,color,align})=>(<td style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}22`,color:color||C.text,fontFamily:mono?"'JetBrains Mono',monospace":"inherit",fontWeight:bold?700:400,fontSize:13,textAlign:align||"left",whiteSpace:"nowrap"}}>{children}</td>);
const Modal=({children,onClose,title})=>(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,animation:"fadeIn 0.2s ease"}} onClick={onClose}><div style={{background:`linear-gradient(180deg,${C.surface},${C.surfaceAlt})`,borderRadius:24,border:`1px solid ${C.border}`,padding:"36px 40px",width:"92%",maxWidth:540,maxHeight:"88vh",overflowY:"auto",animation:"slideUp 0.3s cubic-bezier(.4,0,.2,1)",boxShadow:`0 40px 80px rgba(0,0,0,0.6),0 0 1px ${C.gold}33`}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}><h3 style={{fontSize:20,fontWeight:800,color:C.text,letterSpacing:-0.5}}>{title}</h3><button onClick={onClose} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.textMuted,cursor:"pointer",padding:"6px 10px",fontSize:16,borderRadius:10,transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.red} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>✕</button></div>{children}</div></div>);
const Field=({label,children})=>(<div style={{marginBottom:18}}><label style={{display:"block",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>{label}</label>{children}</div>);
const inputStyle={width:"100%",padding:"12px 16px",borderRadius:12,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:14,outline:"none",transition:"border-color 0.3s,box-shadow 0.3s"};
const selectStyle={...inputStyle,cursor:"pointer"};
const btnPrimary={padding:"12px 24px",borderRadius:12,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,display:"inline-flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${C.gold},${C.accentDark})`,color:"#000",letterSpacing:0.3,transition:"all 0.2s",boxShadow:`0 4px 16px ${C.accentGlow}`};
const btnGhost={padding:"9px 16px",borderRadius:12,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:12,fontWeight:600,background:"transparent",color:C.textMuted,display:"inline-flex",alignItems:"center",gap:5,transition:"all 0.2s"};

// ═══════════════════════════ APP ═══════════════════════════
function App(){
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  const[user,setUser]=useState(null);
  const[page,setPage]=useState("dashboard");
  const[loginForm,setLoginForm]=useState({username:"",password:""});
  const[loginErr,setLoginErr]=useState("");
  const[modal,setModal]=useState(null);
  const[selObra,setSelObra]=useState(null);
  const[filterMes,setFilterMes]=useState("todos");
  const[sideCollapsed,setSideCollapsed]=useState(false);
  const[toast,setToast]=useState(null);
  const[search,setSearch]=useState("");
  const[mobileNav,setMobileNav]=useState(false);
  const[aiAnalysis,setAiAnalysis]=useState(null);
  const[aiLoading,setAiLoading]=useState(false);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};

  useEffect(()=>{
    const dbRef=ref(fdb,"/");
    const unsub=onValue(dbRef,snap=>{
      const val=snap.val();
      if(val&&val.obras){
        setData(val);
        // Force update if cobrancas are incomplete (old version had ~70, new has 90+)
        const hasEquipe=val.equipe&&Object.keys(val.equipe).length>0;
        if(!hasEquipe){
          const seed=buildSeed();
          update(ref(fdb,"/"),{equipe:seed.equipe,diarias:seed.diarias});
        }
      }
      else{const seed=buildSeed();set(ref(fdb,"/"),seed).then(()=>setData(seed));}
      setLoading(false);
    },err=>{console.error(err);setLoading(false);});
    return()=>unsub();
  },[]);

  if(loading)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,color:C.textMuted}}><div style={{textAlign:"center"}}><div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 20px"}}/><p>Conectando ao servidor...</p></div></div>);
  if(!data)return <div style={{padding:40,color:C.text,background:C.bg}}>Erro ao conectar.</div>;

  if(!user){
    const doLogin=()=>{const found=USERS.find(u=>u.username===loginForm.username&&u.password===loginForm.password);if(found){setUser(found);setLoginErr("");if(found.role==="diarista")setPage("funcionarios");}else setLoginErr("Credenciais inválidas");};
    return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 20% 30%,${C.accentGlow},transparent 50%),radial-gradient(ellipse at 80% 70%,rgba(167,139,250,0.04),transparent 50%),${C.bg}`}}>
      <div style={{width:420,padding:"56px 44px",borderRadius:28,background:`linear-gradient(180deg,${C.surface},${C.surfaceAlt})`,border:`1px solid ${C.border}`,animation:"slideUp 0.5s ease",boxShadow:`0 48px 96px rgba(0,0,0,0.5),0 0 0 1px ${C.gold}11`}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{width:72,height:72,borderRadius:20,margin:"0 auto 20px",background:`linear-gradient(135deg,${C.navy},#162449)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,color:C.gold,letterSpacing:-2,boxShadow:`0 12px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)`,border:`1px solid ${C.gold}33`}}>FE</div>
          <h1 style={{fontSize:28,fontWeight:900,color:C.text,letterSpacing:-1}}>Felt Engenharia</h1>
          <p style={{fontSize:13,color:C.textDim,marginTop:8}}>Sistema de Gestão Executiva</p>
          <div style={{width:40,height:2,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"16px auto 0"}}/>
        </div>
        <Field label="Usuário"><input value={loginForm.username} onChange={e=>setLoginForm(p=>({...p,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="seu login" style={inputStyle}/></Field>
        <Field label="Senha"><input type="password" value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" style={inputStyle}/></Field>
        {loginErr&&<p style={{color:C.red,fontSize:12,marginBottom:12,fontWeight:600}}>{loginErr}</p>}
        <button onClick={doLogin} style={{...btnPrimary,width:"100%",justifyContent:"center",padding:"15px 0",marginTop:10,fontSize:15,borderRadius:14}}>Acessar Sistema</button>
      </div>
    </div>);
  }

  const obras=Object.values(data.obras||{});
  const lancs=Object.values(data.lancamentos||{});
  const obraLancs=oid=>lancs.filter(l=>l.obraId===oid&&l.tipo==="obra");
  // Staff data computed early for cost integration
  const _staffList=Object.values(data.equipe||{}).filter(e=>e.ativo!==false);
  const _diariasList=Object.values(data.diarias||{});
  const _mensalistas=_staffList.filter(s=>s.tipo==="mensalista");
  const _obrasAtivas=obras.filter(o=>o.status==="Em andamento");
  const _totalSalarios=_mensalistas.reduce((s,m)=>s+(m.salario||0),0);
  const _rateioMensal=_obrasAtivas.length>0?_totalSalarios/_obrasAtivas.length:0;
  // Diarias cost per obra (all months)
  const diariasCustoObra=(oid)=>{let total=0;_staffList.filter(s=>s.tipo==="diarista").forEach(s=>{const dias=_diariasList.filter(d=>d.equipeId===s.id&&d.obraId===oid).length;total+=dias*(s.valorDiaria||0);});return total;};
  // Mensalista months with diarias (count unique months of activity)
  const mesesAtivos=[...new Set(_diariasList.map(d=>d.data?.slice(0,7)).filter(Boolean))];
  const mensalistaCustoObra=(oid)=>{if(!_obrasAtivas.find(o=>o.id===oid))return 0;return _rateioMensal*mesesAtivos.length;};
  // Custos operacionais por obra (alimentação equipe, combustível, etc)
  const custosOpObra=(oid)=>{return lancs.filter(l=>l.obraId===oid&&l.tipo==="operacional").reduce((s,l)=>s+(l.valor||0),0);};
  // Total custo por obra: lançamentos diretos + diárias + rateio mensalistas + operacional
  const custoObra=oid=>obraLancs(oid).reduce((s,l)=>s+(l.valor||0),0)+diariasCustoObra(oid)+mensalistaCustoObra(oid)+custosOpObra(oid);
  const custoFunc=_totalSalarios*mesesAtivos.length;
  const custoDiariasTotal=_staffList.filter(s=>s.tipo==="diarista").reduce((s,st)=>{const dias=_diariasList.filter(d=>d.equipeId===st.id).length;return s+dias*(st.valorDiaria||0);},0);
  const custoAdm=lancs.filter(l=>l.tipo==="administrativo").reduce((s,l)=>s+(l.valor||0),0);
  const custoTotalObras=obras.reduce((s,o)=>s+custoObra(o.id),0);
  const custoGeral=custoTotalObras+custoAdm;
  const faturamento=obras.reduce((s,o)=>s+(o.contrato||0),0);
  const lucroGeral=faturamento-custoGeral;
  const margemGeral=faturamento>0?lucroGeral/faturamento:0;
  const meses=[...new Set(lancs.map(l=>l.data?.slice(0,7)).filter(Boolean))].sort();
  const custoMes={};meses.forEach(m=>{custoMes[m]=lancs.filter(l=>l.data?.startsWith(m)).reduce((s,l)=>s+(l.valor||0),0);});
  const obraKPIs=obras.map((o,idx)=>{const custo=custoObra(o.id),imp=(o.contrato||0)*(o.aliquota||0),rtV=(o.contrato||0)*(o.rt||0),recLiq=(o.contrato||0)-imp-rtV,lb=(o.contrato||0)-custo,ll=recLiq-custo,m=o.contrato>0?lb/o.contrato:0,ml=o.contrato>0?ll/o.contrato:0,roi=custo>0?((o.contrato||0)-custo)/custo:0,ex=o.contrato>0?custo/o.contrato:0;return{...o,custo,imposto:imp,rtVal:rtV,recLiq,lucroBruto:lb,lucroLiq:ll,margem:m,margemLiq:ml,roi,execucao:ex,color:palette[idx%palette.length]};});
  const isAdmin=user.role==="admin";
  const isDiarista=user.role==="diarista";
  // Diarista only sees Equipe page
  const visibleNav=isDiarista?[{id:"funcionarios",label:"Equipe",emoji:"👷"}]:[{id:"dashboard",label:"Dashboard",emoji:"📊"},{id:"obras",label:"Obras",emoji:"🏗️"},{id:"faturamento",label:"Faturamento",emoji:"💰"},{id:"funcionarios",label:"Equipe",emoji:"👷"},{id:"operacional",label:"Operacional",emoji:"⛽"},{id:"administrativo",label:"Admin",emoji:"💼"},{id:"kpis",label:"KPIs",emoji:"🎯"},{id:"historico",label:"Histórico",emoji:"📝"}];

  const fbAddObra=o=>{const id=uid();set(ref(fdb,`obras/${id}`),{...o,id});showToast("Obra criada");};
  const fbEditObra=(id,u)=>{update(ref(fdb,`obras/${id}`),u);showToast("Obra atualizada");};
  const fbDelObra=id=>{remove(ref(fdb,`obras/${id}`));lancs.filter(l=>l.obraId===id).forEach(l=>remove(ref(fdb,`lancamentos/${l.id}`)));setSelObra(null);showToast("Obra removida");};
  const fbAddLanc=l=>{const id=uid();set(ref(fdb,`lancamentos/${id}`),{...l,id});fbLog("Lançamento criado",l.descricao+" — "+l.valor);showToast("Lançamento registrado");};
  const fbEditLanc=(id,u)=>{update(ref(fdb,`lancamentos/${id}`),u);fbLog("Lançamento editado",u.descricao||id);showToast("Atualizado");};
  const fbDelLanc=id=>{const old=data.lancamentos?.[id];remove(ref(fdb,`lancamentos/${id}`));fbLog("Lançamento removido",old?.descricao||id);showToast("Removido");};
  const fbAddCob=c=>{const id=uid();set(ref(fdb,`cobrancas/${id}`),{...c,id});fbLog("Cobrança criada",c.cliente+" — "+c.valor);showToast("Cobrança registrada");};
  const fbEditCob=(cobId,u)=>{
    // Find the Firebase key for this cobranca
    const entries=Object.entries(data.cobrancas||{});
    const found=entries.find(([k,v])=>v.id===cobId||k===cobId);
    if(!found){console.error("Cob not found:",cobId);return;}
    const[fbKey]=found;
    set(ref(fdb,`cobrancas/${fbKey}`),{...u,id:cobId});
    fbLog("Cobrança editada",u.cliente||cobId);showToast("Cobrança atualizada");
  };
  const fbStatusCob=(cobId,novoStatus)=>{
    const entries=Object.entries(data.cobrancas||{});
    const found=entries.find(([k,v])=>v.id===cobId||k===cobId);
    if(!found){console.error("Cob not found for status:",cobId);return;}
    const[fbKey,cob]=found;
    const updated={...cob,status:novoStatus};
    if(novoStatus==="RECEBIDO")updated.dataRecebimento=new Date().toISOString().slice(0,10);
    set(ref(fdb,`cobrancas/${fbKey}`),updated);
    fbLog("Status cobrança",`${cob.cliente}: ${cob.status} → ${novoStatus}`);
    showToast(`${cob.cliente} → ${novoStatus}`);
  };
  const fbDelCob=cobId=>{
    const entries=Object.entries(data.cobrancas||{});
    const found=entries.find(([k,v])=>v.id===cobId||k===cobId);
    if(!found)return;
    const[fbKey,old]=found;
    remove(ref(fdb,`cobrancas/${fbKey}`));
    fbLog("Cobrança removida",old?.cliente||cobId);showToast("Removido");
  };
  const fbAddNf=n=>{const id=uid();set(ref(fdb,`nfs/${id}`),{...n,id});fbLog("NF registrada",n.cliente);showToast("NF registrada");};
  const fbDelNf=id=>{remove(ref(fdb,`nfs/${id}`));fbLog("NF removida",id);showToast("NF removida");};
  // Audit log
  const fbLog=(acao,detalhe)=>{const id=uid();set(ref(fdb,`auditLog/${id}`),{id,acao,detalhe,usuario:user?.nome||"?",timestamp:new Date().toISOString()});};
  const auditLogs=Object.values(data.auditLog||{}).sort((a,b)=>(b.timestamp||"").localeCompare(a.timestamp||"")).slice(0,50);
  // Equipe & Diarias CRUD
  const staffList=Object.values(data.equipe||{}).filter(e=>e.ativo!==false);
  const diariasList=Object.values(data.diarias||{});
  const fbAddStaff=s=>{const id=uid();set(ref(fdb,`equipe/${id}`),{...s,id,ativo:true});fbLog("Funcionário cadastrado",s.nome);showToast("Funcionário cadastrado");};
  const fbEditStaff=(id,u)=>{update(ref(fdb,`equipe/${id}`),u);fbLog("Funcionário editado",u.nome||id);showToast("Atualizado");};
  const fbDelStaff=id=>{update(ref(fdb,`equipe/${id}`),{ativo:false});fbLog("Funcionário desativado",id);showToast("Desativado");};
  const fbAddDiaria=d=>{const id=uid();set(ref(fdb,`diarias/${id}`),{...d,id});showToast("Diária registrada");};
  const fbDelDiaria=id=>{remove(ref(fdb,`diarias/${id}`));showToast("Diária removida");};
  // Pagamentos CRUD
  const pagList=Object.values(data.pagamentos||{});
  const fbAddPag=p=>{const id=uid();set(ref(fdb,`pagamentos/${id}`),{...p,id});fbLog("Pagamento registrado",p.equipeNome+" — "+p.valor);showToast("Pagamento registrado");};
  const fbDelPag=id=>{remove(ref(fdb,`pagamentos/${id}`));fbLog("Pagamento removido",id);showToast("Pagamento removido");};
  // Diarias por funcionário por obra por mês
  const getDiariasCount=(eqId,obraId,mes)=>diariasList.filter(d=>d.equipeId===eqId&&d.obraId===obraId&&d.data?.startsWith(mes)).length;
  const getDiariasCustoObra=(obraId,mes)=>{let total=0;staffList.filter(s=>s.tipo==="diarista").forEach(s=>{const dias=getDiariasCount(s.id,obraId,mes);total+=dias*(s.valorDiaria||0);});return total;};
  const getMensalistaCustoObra=(mes)=>{const mensalistas=staffList.filter(s=>s.tipo==="mensalista");const obrasAtivas=obras.filter(o=>o.status==="Em andamento");if(!obrasAtivas.length)return{};const perObra={};const custoMensal=mensalistas.reduce((s,m)=>s+(m.salario||0),0);const rateio=custoMensal/obrasAtivas.length;obrasAtivas.forEach(o=>{perObra[o.id]=rateio;});return perObra;};
  // Custom CC: collect all unique centros de custo used in lancamentos
  const allCC=[...new Set([...CC_OBRA_DEFAULT,...lancs.map(l=>l.centroCusto).filter(Boolean)])].sort();
  // Cobrancas & clientes data
  const cobs=Object.values(data.cobrancas||{});
  const clientes=Object.values(data.clientes||{});
  const nfsList=Object.values(data.nfs||{});
  const totalRecebido=cobs.filter(c=>c.status==="RECEBIDO").reduce((s,c)=>s+(c.valor||0),0);
  const totalAVencer=cobs.filter(c=>c.status==="A VENCER").reduce((s,c)=>s+(c.valor||0),0);
  const totalVencido=cobs.filter(c=>c.status==="VENCIDO").reduce((s,c)=>s+(c.valor||0),0);
  const totalProximo=cobs.filter(c=>c.status==="PROXIMO").reduce((s,c)=>s+(c.valor||0),0);
  const portfolioTotal=clientes.reduce((s,c)=>s+(c.contrato||0),0);
  const portfolioRecebido=clientes.reduce((s,c)=>s+(c.pagoPre||0),0)+totalRecebido;
  const portfolioAReceber=portfolioTotal-portfolioRecebido;
  // Obra-Cliente cross-reference: match cobranças to obras by name
  const obraRecebido=(obraId)=>{const keys=OBRA_CLIENTE_MAP[obraId]||[];if(!keys.length)return 0;return cobs.filter(c=>c.status==="RECEBIDO"&&keys.some(k=>c.cliente?.toUpperCase().includes(k.toUpperCase()))).reduce((s,c)=>s+(c.valor||0),0);};
  // Search helper
  const matchSearch=(text)=>!search||text?.toLowerCase().includes(search.toLowerCase());
  const filterLancs=(tipo,obraId=null)=>{let l=lancs.filter(x=>x.tipo===tipo);if(obraId)l=l.filter(x=>x.obraId===obraId);if(filterMes!=="todos")l=l.filter(x=>x.data?.startsWith(filterMes));return l.sort((a,b)=>(b.data||"").localeCompare(a.data||""));};

  const navItems=visibleNav;

  // Forms
  const LancForm=({initial,tipo,onClose})=>{
    const[f,setF]=useState(initial||{descricao:"",valor:"",data:new Date().toISOString().slice(0,10),centroCusto:tipo==="obra"?"MATERIAL":tipo==="funcionario"?"TIAGO":"CONTABILIDADE",obs:"",obraId:selObra||(obras[0]?.id??""),tipo});
    const cc=tipo==="obra"?allCC:tipo==="funcionario"?CC_FUNC:CC_ADM;
    const doSave=()=>{if(!f.descricao||!f.valor)return;const d={...f,valor:parseFloat(f.valor)};if(initial)fbEditLanc(initial.id,d);else fbAddLanc(d);onClose();};
    return(<Modal title={initial?"Editar Lançamento":"Novo Lançamento"} onClose={onClose}>
      {tipo==="obra"&&<Field label="Obra"><select value={f.obraId} onChange={e=>setF(p=>({...p,obraId:e.target.value}))} style={selectStyle}>{obras.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>}
      <Field label="Descrição"><input value={f.descricao} onChange={e=>setF(p=>({...p,descricao:e.target.value}))} style={inputStyle}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Valor (R$)"><input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/></Field>
        <Field label="Data"><input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/></Field>
      </div>
      <Field label={tipo==="obra"?"Centro de Custo (selecione ou digite novo)":"Centro de Custo"}>
        {tipo==="obra"?(<><input list="cc-list" value={f.centroCusto} onChange={e=>setF(p=>({...p,centroCusto:e.target.value.toUpperCase()}))} style={inputStyle} placeholder="Selecione ou digite..."/><datalist id="cc-list">{cc.map(c=><option key={c} value={c}/>)}</datalist></>)
        :(<select value={f.centroCusto} onChange={e=>setF(p=>({...p,centroCusto:e.target.value}))} style={selectStyle}>{cc.map(c=><option key={c} value={c}>{c}</option>)}</select>)}
      </Field>
      <Field label="Obs"><input value={f.obs} onChange={e=>setF(p=>({...p,obs:e.target.value}))} style={inputStyle}/></Field>
      <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Registrar"}</button>
    </Modal>);
  };
  const ObraForm=({initial,onClose})=>{
    const[f,setF]=useState(initial?{nome:initial.nome,contrato:initial.contrato,aliquota:(initial.aliquota||0)*100,rt:(initial.rt||0)*100,status:initial.status}:{nome:"",contrato:"",aliquota:0,rt:0,status:"Em andamento"});
    const doSave=()=>{if(!f.nome||!f.contrato)return;const d={nome:f.nome,contrato:parseFloat(f.contrato),aliquota:(parseFloat(f.aliquota)||0)/100,rt:(parseFloat(f.rt)||0)/100,status:f.status};if(initial)fbEditObra(initial.id,d);else fbAddObra(d);onClose();};
    return(<Modal title={initial?"Editar Obra":"Nova Obra"} onClose={onClose}>
      <Field label="Nome"><input value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value}))} style={inputStyle}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Contrato (R$)"><input type="number" value={f.contrato} onChange={e=>setF(p=>({...p,contrato:e.target.value}))} style={inputStyle}/></Field>
        <Field label="Status"><select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={selectStyle}>{STATUS_OPTS.map(s=><option key={s}>{s}</option>)}</select></Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Alíquota (%)"><input type="number" step="0.01" value={f.aliquota} onChange={e=>setF(p=>({...p,aliquota:e.target.value}))} style={inputStyle}/></Field>
        <Field label="RT (%)"><input type="number" step="0.01" value={f.rt} onChange={e=>setF(p=>({...p,rt:e.target.value}))} style={inputStyle}/></Field>
      </div>
      <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Criar Obra"}</button>
    </Modal>);
  };

  // Pages
  // ── STRATEGIC COMPUTED DATA ──
  const MESES_ALL=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  const hoje=new Date("2026-04-15");
  const em7=new Date(hoje);em7.setDate(em7.getDate()+7);
  const em30=new Date(hoje);em30.setDate(em30.getDate()+30);
  // Recebimentos por mês
  const recMes={};cobs.filter(c=>c.status==="RECEBIDO").forEach(c=>{const m=c.data?.slice(0,7);if(m)recMes[m]=(recMes[m]||0)+(c.valor||0);});
  // Despesas por mês  
  const despMes={};lancs.forEach(l=>{const m=l.data?.slice(0,7);if(m)despMes[m]=(despMes[m]||0)+(l.valor||0);});
  // Fluxo de caixa mensal
  const fluxoMeses=["2026-01","2026-02","2026-03"];
  const fluxoData=fluxoMeses.map(m=>({m,label:MESES_ALL[parseInt(m.slice(5))-1],rec:recMes[m]||0,desp:despMes[m]||0,saldo:(recMes[m]||0)-(despMes[m]||0)}));
  let saldoAcum=0;fluxoData.forEach(f=>{saldoAcum+=f.saldo;f.acumulado=saldoAcum;});
  // Burn rate (média de despesas mensais)
  const mesesComDesp=Object.keys(despMes).filter(m=>m.startsWith("2026"));
  const burnRate=mesesComDesp.length>0?mesesComDesp.reduce((s,m)=>s+(despMes[m]||0),0)/mesesComDesp.length:0;
  // Inadimplência
  const inadimplencia=portfolioTotal>0?totalVencido/portfolioTotal:0;
  // Ticket médio por ano
  const ticketPorAno={};clientes.forEach(c=>{if(!ticketPorAno[c.ano])ticketPorAno[c.ano]={total:0,count:0};ticketPorAno[c.ano].total+=(c.contrato||0);ticketPorAno[c.ano].count++;});
  // Concentração de receita
  const clientesSorted=[...clientes].sort((a,b)=>(b.contrato||0)-(a.contrato||0));
  const top3Valor=clientesSorted.slice(0,3).reduce((s,c)=>s+(c.contrato||0),0);
  const concentracao=portfolioTotal>0?top3Valor/portfolioTotal:0;
  // MO ratio per obra
  const moRatioObras=obraKPIs.map(o=>{const mo=obraLancs(o.id).filter(l=>l.centroCusto==="MÃO DE OBRA").reduce((s,l)=>s+(l.valor||0),0);return{...o,moVal:mo,moRatio:o.contrato>0?mo/o.contrato:0};});
  // Cobranças vencendo em 7 dias
  const cobsEm7=cobs.filter(c=>{if(c.status==="RECEBIDO")return false;const d=new Date(c.data);return d>=hoje&&d<=em7;});
  const cobsVencidas=cobs.filter(c=>c.status==="VENCIDO");
  // Obras com risco de estouro (execução > 60% com margem < 20%)
  const obrasRisco=obraKPIs.filter(o=>o.execucao>0.6&&o.margem<0.2&&o.custo>0);
  // Prox30
  const prox30=cobs.filter(c=>{if(c.status==="RECEBIDO")return false;const d=new Date(c.data);return d>=hoje&&d<=em30;}).sort((a,b)=>(a.data||"").localeCompare(b.data||""));
  const prox30Total=prox30.reduce((s,c)=>s+(c.valor||0),0);

  const DashPage=()=>{
    return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><div><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>Dashboard Executivo</h2><p style={{fontSize:13,color:C.textDim,marginTop:4}}>Felt Engenharia — Abril 2026</p></div><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:4,background:C.green,animation:"pulse 2s ease infinite"}}/><span style={{fontSize:11,color:C.textDim}}>Sync em tempo real</span></div></div>

    {/* ── ALERTAS INTELIGENTES ── */}
    {(cobsVencidas.length>0||cobsEm7.length>0||obrasRisco.length>0)&&(<div style={{marginBottom:20,display:"grid",gap:10}}>
      {cobsVencidas.length>0&&(<div style={{background:C.red+"10",borderRadius:14,border:`1px solid ${C.red}33`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><p style={{fontSize:13,fontWeight:800,color:C.red}}>🚨 {cobsVencidas.length} cobranças vencidas — {R$(totalVencido)}</p><p style={{fontSize:11,color:C.textMuted,marginTop:2}}>{cobsVencidas.map(c=>c.cliente).join(", ")}</p></div><button onClick={()=>setPage("faturamento")} style={{...btnGhost,borderColor:C.red+"44",color:C.red,fontSize:11}}>Ver detalhes →</button></div>)}
      {cobsEm7.length>0&&(<div style={{background:C.amber+"10",borderRadius:14,border:`1px solid ${C.amber}33`,padding:"14px 20px"}}><p style={{fontSize:13,fontWeight:800,color:C.amber}}>⏰ {cobsEm7.length} cobranças vencem nos próximos 7 dias — {R$(cobsEm7.reduce((s,c)=>s+(c.valor||0),0))}</p><div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>{cobsEm7.map(c=>(<span key={c.id} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:C.amber+"18",color:C.amber}}>{c.cliente} · {R$(c.valor)} · {fmtD(c.data)}</span>))}</div></div>)}
      {obrasRisco.length>0&&(<div style={{background:C.purple+"10",borderRadius:14,border:`1px solid ${C.purple}33`,padding:"14px 20px"}}><p style={{fontSize:13,fontWeight:800,color:C.purple}}>⚠️ {obrasRisco.length} obras com risco de estouro de custo</p><div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>{obrasRisco.map(o=>(<span key={o.id} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:C.purple+"18",color:C.purple}}>{o.nome} — {pct(o.execucao)} gasto, margem {pct(o.margem)}</span>))}</div></div>)}
    </div>)}

    {/* ── KPIs PRINCIPAIS ── */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
      <MetricCard label="Faturamento Contratado" value={R$(faturamento)} color={C.accent} sub={`${obras.length} obras ativas`}/>
      <MetricCard label="Custo Total" value={R$(custoGeral)} color={C.amber} sub={`${lancs.length} lançamentos`}/>
      <MetricCard label="Lucro Bruto" value={R$(lucroGeral)} color={lucroGeral>=0?C.green:C.red}/>
      <MetricCard label="Margem Geral" value={pct(margemGeral)} color={margemGeral>=0.2?C.green:margemGeral>=0.1?C.amber:C.red} sub={margemGeral>=0.25?"Saudável":margemGeral>=0.1?"Atenção":"Crítico"}/>
      <MetricCard label="Recebido (2026)" value={R$(cobs.filter(c=>c.status==="RECEBIDO").reduce((s,c)=>s+(c.valor||0),0))} color={C.green}/>
      <MetricCard label="Próx. 30 dias" value={R$(prox30Total)} color={C.cyan} sub={`${prox30.length} cobranças`}/>
    </div>

    {/* ── KPIS ESTRATÉGICOS ── */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 20px"}}><p style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>Burn Rate Mensal</p><p style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:6}}>{R$(burnRate)}</p><p style={{fontSize:10,color:C.textDim,marginTop:4}}>Gasto médio/mês (Jan-Mar)</p></div>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 20px"}}><p style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>Inadimplência</p><p style={{fontSize:22,fontWeight:800,color:inadimplencia>0.02?C.red:C.green,marginTop:6}}>{pct(inadimplencia)}</p><p style={{fontSize:10,color:C.textDim,marginTop:4}}>{R$(totalVencido)} vencido de {R$(portfolioTotal)}</p></div>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 20px"}}><p style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>Concentração Top 3</p><p style={{fontSize:22,fontWeight:800,color:concentracao>0.4?C.amber:C.green,marginTop:6}}>{pct(concentracao)}</p><p style={{fontSize:10,color:C.textDim,marginTop:4}}>{clientesSorted.slice(0,3).map(c=>c.nome).join(", ")}</p></div>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 20px"}}><p style={{fontSize:10,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>Ticket Médio 2026</p><p style={{fontSize:22,fontWeight:800,color:C.accent,marginTop:6}}>{ticketPorAno[2026]?R$(ticketPorAno[2026].total/ticketPorAno[2026].count):"—"}</p><p style={{fontSize:10,color:C.textDim,marginTop:4}}>{ticketPorAno[2025]?"2025: "+R$(ticketPorAno[2025].total/ticketPorAno[2025].count):""}</p></div>
    </div>

    {/* ── FLUXO DE CAIXA ── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
        <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Fluxo de Caixa — Receita vs Despesa</p>
        {fluxoData.map(f=>(<div key={f.m} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,fontWeight:700}}>{f.label}</span><span style={{fontSize:12,fontWeight:800,color:f.saldo>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>Saldo: {R$(f.saldo)}</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}><span style={{fontSize:10,color:C.green,width:50}}>Entrada</span><div style={{flex:1}}><ProgressBar value={f.rec} max={Math.max(f.rec,f.desp,1)} color={C.green}/></div><span style={{fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",minWidth:90,textAlign:"right"}}>{R$(f.rec)}</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:10,color:C.red,width:50}}>Saída</span><div style={{flex:1}}><ProgressBar value={f.desp} max={Math.max(f.rec,f.desp,1)} color={C.red}/></div><span style={{fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",minWidth:90,textAlign:"right"}}>{R$(f.desp)}</span></div>
        </div>))}
        <div style={{marginTop:12,padding:"12px 16px",borderRadius:10,background:saldoAcum>=0?C.green+"12":C.red+"12",border:`1px solid ${saldoAcum>=0?C.green:C.red}33`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:saldoAcum>=0?C.green:C.red}}>Saldo Acumulado (Jan-Mar)</span><span style={{fontSize:16,fontWeight:800,color:saldoAcum>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{R$(saldoAcum)}</span></div></div>
      </div>

      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
        <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Distribuição de Custos</p>
        <div style={{display:"flex",alignItems:"center",gap:28}}><Donut segments={[{value:custoTotalObras,color:C.accent},{value:custoFunc,color:C.purple},{value:custoAdm,color:C.amber}]} label="Total"/><div style={{flex:1}}>{[{label:"Obras",val:custoTotalObras,color:C.accent},{label:"Equipe",val:custoFunc,color:C.purple},{label:"Admin",val:custoAdm,color:C.amber}].map(it=>(<div key={it.label} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:3,background:it.color}}/><span style={{fontSize:12,color:C.textMuted}}>{it.label}</span></div><span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(it.val)}</span></div><ProgressBar value={custoGeral>0?it.val/custoGeral:0} max={1} color={it.color}/></div>))}</div></div>
      </div>
    </div>

    {/* ── RENTABILIDADE REAL POR OBRA ── */}
    <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:20}}>
      <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Rentabilidade Real por Obra — Receita vs Custo</p>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Obra</TH><TH align="right">Contrato</TH><TH align="right">Já Recebeu</TH><TH align="right">Já Gastou</TH><TH align="right">Saldo Caixa</TH><TH>MO/Contrato</TH><TH>Status</TH></tr></thead>
      <tbody>{moRatioObras.map(o=>{
        const recObra=obraRecebido(o.id);
        const saldoCaixa=recObra-o.custo;
        const moAlert=o.moRatio>0.4;
        return(<tr key={o.id} style={{cursor:"pointer"}} onClick={()=>{setSelObra(o.id);setPage("obras");}}>
          <TD bold><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:4,background:o.color}}/>{o.nome}</div></TD>
          <TD mono align="right">{R$(o.contrato)}</TD>
          <TD mono align="right" color={C.green}>{R$(recObra)}</TD>
          <TD mono align="right" color={C.amber}>{R$(o.custo)}</TD>
          <TD mono bold align="right" color={saldoCaixa>=0?C.green:C.red}>{R$(saldoCaixa)}</TD>
          <TD><Badge text={pct(o.moRatio)} color={moAlert?C.red:C.green}/></TD>
          <TD><Badge text={o.margem>=0.25?"Saudável":o.margem>=0.1?"Atenção":"Crítico"} color={o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red}/></TD>
        </tr>);})}
      </tbody></table></div>
    </div>

    {/* ── PERFORMANCE POR OBRA ── */}
    <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Performance por Obra</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>{obraKPIs.map(o=>(<div key={o.id} style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 22px",cursor:"pointer",transition:"border-color 0.2s,transform 0.2s",borderLeft:`4px solid ${o.color}`}} onClick={()=>{setSelObra(o.id);setPage("obras");}} onMouseEnter={e=>{e.currentTarget.style.borderColor=o.color+"66";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div><p style={{fontSize:14,fontWeight:800}}>{o.nome}</p><p style={{fontSize:20,fontWeight:800,color:o.color,marginTop:4}}>{R$(o.contrato)}</p></div><Badge text={o.status} color={o.status==="Em andamento"?C.accent:o.status==="Concluída"?C.green:C.amber}/></div><div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:C.textDim}}>Execução</span><span style={{fontSize:11,fontWeight:700,color:o.execucao>0.8?C.red:o.execucao>0.6?C.amber:C.green}}>{pct(o.execucao)}</span></div><ProgressBar value={o.execucao} max={1} color={o.execucao>0.8?C.red:o.execucao>0.6?C.amber:C.green}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}><div><span style={{color:C.textDim}}>Lucro</span><p style={{fontWeight:700,color:o.lucroBruto>=0?C.green:C.red,marginTop:2}}>{R$(o.lucroBruto)}</p></div><div style={{textAlign:"right"}}><span style={{color:C.textDim}}>Margem</span><p style={{fontWeight:700,color:o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red,marginTop:2}}>{pct(o.margem)}</p></div></div></div>))}</div>
  </div>);};

  const ObrasPage=()=>{
    const obra=obras.find(o=>o.id===selObra),kpi=obraKPIs.find(o=>o.id===selObra);
    const ls=selObra?filterLancs("obra",selObra):[];
    const ccB={};if(selObra)obraLancs(selObra).forEach(l=>{ccB[l.centroCusto]=(ccB[l.centroCusto]||0)+(l.valor||0);});
    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>Gestão de Obras</h2>{isAdmin&&<button onClick={()=>setModal({type:"obraForm"})} style={btnPrimary}>＋ Nova Obra</button>}</div>
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>{obras.map((o,i)=>(<button key={o.id} onClick={()=>setSelObra(o.id)} style={{padding:"10px 20px",borderRadius:12,border:`1px solid ${selObra===o.id?palette[i%palette.length]+"66":C.border}`,background:selObra===o.id?palette[i%palette.length]+"18":"transparent",color:selObra===o.id?palette[i%palette.length]:C.textMuted,fontSize:13,fontWeight:selObra===o.id?700:500,cursor:"pointer"}}>{o.nome}</button>))}</div>
      {obra&&kpi?(<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}><MetricCard small label="Contrato" value={R$(obra.contrato)} color={kpi.color}/><MetricCard small label="Custo" value={R$(kpi.custo)} color={C.amber}/><MetricCard small label="Lucro" value={R$(kpi.lucroBruto)} color={kpi.lucroBruto>=0?C.green:C.red}/><MetricCard small label="Margem" value={pct(kpi.margem)} color={kpi.margem>=0.25?C.green:kpi.margem>=0.1?C.amber:C.red}/><MetricCard small label="ROI" value={pct(kpi.roi)} color={C.purple}/><MetricCard small label="Rec.Líq." value={R$(kpi.recLiq)} color={C.cyan}/></div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}><p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Por Centro de Custo</p><div style={{display:"flex",flexWrap:"wrap",gap:10}}>{Object.entries(ccB).sort((a,b)=>b[1]-a[1]).map(([cc,val],i)=>(<div key={cc} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}><div style={{width:8,height:8,borderRadius:4,background:palette[i%palette.length]}}/><span style={{fontSize:11,color:C.textMuted}}>{cc}</span><span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(val)}</span></div>))}</div></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{display:"flex",gap:8,alignItems:"center"}}><select value={filterMes} onChange={e=>setFilterMes(e.target.value)} style={{...selectStyle,padding:"8px 12px",fontSize:12}}><option value="todos">Todos</option>{meses.map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}</select>{isAdmin&&<><button onClick={()=>setModal({type:"obraEdit",obra})} style={btnGhost}>✏️ Editar</button><button onClick={()=>{if(confirm(`Excluir ${obra.nome}?`))fbDelObra(obra.id);}} style={{...btnGhost,color:C.red,borderColor:C.red+"44"}}>🗑️</button></>}</div>{isAdmin&&<button onClick={()=>setModal({type:"lancForm",tipo:"obra"})} style={btnPrimary}>＋ Lançamento</button>}</div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>#</TH><TH>Descrição</TH><TH align="right">Valor</TH><TH>Data</TH><TH>C.Custo</TH><TH>Obs</TH>{isAdmin&&<TH></TH>}</tr></thead><tbody>{ls.map((l,i)=>(<tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD color={C.textDim}>{i+1}</TD><TD bold>{l.descricao}</TD><TD mono bold align="right">{R$(l.valor)}</TD><TD>{fmtD(l.data)}</TD><TD><Badge text={l.centroCusto} color={C.accent}/></TD><TD color={C.textDim}>{l.obs||"—"}</TD>{isAdmin&&<TD><div style={{display:"flex",gap:4}}><button onClick={()=>setModal({type:"lancEdit",lanc:l,tipo:"obra"})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button><button onClick={()=>fbDelLanc(l.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></div></TD>}</tr>))}{ls.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:"center",color:C.textDim}}>Nenhum lançamento</td></tr>}</tbody></table></div></div>
      </>):(<div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"60px 40px",textAlign:"center"}}><p style={{fontSize:40,marginBottom:12}}>🏗️</p><p style={{fontSize:16,color:C.textMuted,fontWeight:600}}>Selecione uma obra</p></div>)}
    </div>);
  };

  // ── EQUIPE PAGE ──
  const EquipePage=()=>{
    const[eqTab,setEqTab]=useState("cadastro");
    const[eqMes,setEqMes]=useState("2026-03");
    const[newDiaria,setNewDiaria]=useState({equipeId:"",obraId:"",data:""});
    const[newPag,setNewPag]=useState({equipeId:"",valor:"",data:new Date().toISOString().slice(0,10),obs:""});
    const[calEq,setCalEq]=useState("");
    const[calDraft,setCalDraft]=useState({});// {day: obraId} — unsaved calendar entries
    const diaristas=staffList.filter(s=>s.tipo==="diarista");
    const mensalistas=staffList.filter(s=>s.tipo==="mensalista");
    const totalSalarios=mensalistas.reduce((s,m)=>s+(m.salario||0),0);
    const obrasAtivas=obras.filter(o=>o.status==="Em andamento");
    const rateioMensal=obrasAtivas.length>0?totalSalarios/obrasAtivas.length:0;
    const diariasMes=diariasList.filter(d=>d.data?.startsWith(eqMes));
    const custoDiarioTotal=diaristas.reduce((s,d)=>{const dias=diariasMes.filter(x=>x.equipeId===d.id).length;return s+dias*(d.valorDiaria||0);},0);
    const resumoDiaristas=diaristas.map(d=>{const dias=diariasMes.filter(x=>x.equipeId===d.id);const totalDias=dias.length;const custoTotal=totalDias*(d.valorDiaria||0);const porObra={};dias.forEach(x=>{porObra[x.obraId]=(porObra[x.obraId]||0)+1;});return{...d,totalDias,custoTotal,porObra};});
    // Pagamentos computed
    const pagMes=pagList.filter(p=>p.referencia===eqMes||p.data?.startsWith(eqMes));
    const totalPagoMes=pagMes.reduce((s,p)=>s+(p.valor||0),0);
    const devidoTotal=totalSalarios+custoDiarioTotal;
    const saldoDevedor=devidoTotal-totalPagoMes;
    const pagPorPessoa={};staffList.forEach(s=>{const pags=pagMes.filter(p=>p.equipeId===s.id);const totalPago=pags.reduce((sum,p)=>sum+(p.valor||0),0);let devido=0;if(s.tipo==="mensalista")devido=s.salario||0;else{const dias=diariasMes.filter(d=>d.equipeId===s.id).length;devido=dias*(s.valorDiaria||0);}pagPorPessoa[s.id]={...s,pags,totalPago,devido,saldo:devido-totalPago};});

    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><div><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>👷 Gestão de Equipe</h2><p style={{fontSize:13,color:C.textDim,marginTop:4}}>{staffList.length} colaboradores — {diaristas.length} diaristas, {mensalistas.length} mensalistas</p></div>{isAdmin&&<button onClick={()=>setModal({type:"staffForm"})} style={btnPrimary}>＋ Novo Funcionário</button>}</div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:20}}>
        <MetricCard small label="Folha Mensal (fixos)" value={R$(totalSalarios)} color={C.purple} sub={`${mensalistas.length} mensalistas`}/>
        <MetricCard small label="Rateio/Obra (fixos)" value={R$(rateioMensal)} color={C.accent} sub={`${obrasAtivas.length} obras ativas`}/>
        <MetricCard small label={`Diárias ${eqMes.replace("-","/")}`} value={R$(custoDiarioTotal)} color={C.amber} sub={`${diariasMes.length} diárias`}/>
        <MetricCard small label="Custo MO Total/Mês" value={R$(totalSalarios+custoDiarioTotal)} color={C.red}/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>{[{id:"cadastro",label:"📋 Cadastro"},{id:"diarias",label:"📅 Controle de Diárias"},{id:"pagamentos",label:"💳 Pagamentos"},{id:"resumo",label:"📊 Resumo por Obra"}].map(t=>(<button key={t.id} onClick={()=>setEqTab(t.id)} style={{padding:"9px 16px",borderRadius:10,border:`1px solid ${eqTab===t.id?C.accent+"66":C.border}`,background:eqTab===t.id?C.accentGlow:"transparent",color:eqTab===t.id?C.accent:C.textMuted,fontSize:12,fontWeight:eqTab===t.id?700:500,cursor:"pointer"}}>{t.label}</button>))}</div>

      {/* ── CADASTRO ── */}
      {eqTab==="cadastro"&&(<>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Mensalistas — Rateio igual entre {obrasAtivas.length} obras ativas ({R$(rateioMensal)}/obra)</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Nome</TH><TH>Função</TH><TH align="right">Salário</TH><TH align="right">Rateio/Obra</TH>{isAdmin&&<TH></TH>}</tr></thead>
          <tbody>{mensalistas.map(m=>(<tr key={m.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD bold>{m.nome}</TD><TD><Badge text={m.funcao} color={C.purple}/></TD><TD mono align="right">{R$(m.salario)}</TD><TD mono align="right" color={C.accent}>{R$(rateioMensal)}</TD>{isAdmin&&<TD><button onClick={()=>setModal({type:"staffEdit",staff:m})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button></TD>}</tr>))}</tbody></table></div>
        </div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Diaristas — Pagamento por dia trabalhado</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Nome</TH><TH>Função</TH><TH align="right">Diária</TH>{isAdmin&&<TH></TH>}</tr></thead>
          <tbody>{diaristas.map(d=>(<tr key={d.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD bold>{d.nome}</TD><TD><Badge text={d.funcao} color={C.amber}/></TD><TD mono align="right">{R$(d.valorDiaria)}</TD>{isAdmin&&<TD><div style={{display:"flex",gap:4}}><button onClick={()=>setModal({type:"staffEdit",staff:d})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button><button onClick={()=>{if(confirm(`Desativar ${d.nome}?`))fbDelStaff(d.id);}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></div></TD>}</tr>))}</tbody></table></div>
        </div>
      </>)}

      {/* ── CONTROLE DE DIÁRIAS — CALENDÁRIO ── */}
      {eqTab==="diarias"&&(()=>{
        const year=parseInt(eqMes.slice(0,4)),month=parseInt(eqMes.slice(5,7));
        const daysInMonth=new Date(year,month,0).getDate();
        const firstDayOfWeek=new Date(year,month-1,1).getDay();// 0=Dom
        const dayNames=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
        const selectedStaff=staffList.find(s=>s.id===calEq);
        // Existing diarias for this person+month
        const existingDiarias=calEq?diariasMes.filter(d=>d.equipeId===calEq):[];
        const existingMap={};existingDiarias.forEach(d=>{const day=parseInt(d.data.slice(8,10));existingMap[day]={obraId:d.obraId,diariaId:d.id};});
        // Merge existing + draft
        const allDays={...existingMap};Object.entries(calDraft).forEach(([day,obraId])=>{if(obraId)allDays[parseInt(day)]={obraId,isDraft:true};});
        const totalDias=Object.keys(allDays).length;
        const totalValor=totalDias*(selectedStaff?.valorDiaria||0);
        const draftCount=Object.keys(calDraft).filter(k=>calDraft[k]&&!existingMap[parseInt(k)]).length;

        const handleDayClick=(day)=>{
          if(!calEq||!isAdmin)return;
          const dateStr=`${eqMes}-${String(day).padStart(2,"0")}`;
          const dow=new Date(year,month-1,day).getDay();
          if(dow===0)return;// Skip sundays
          if(existingMap[day]){
            // Already saved — click to remove
            if(confirm(`Remover diária de ${selectedStaff?.nome} em ${fmtD(dateStr)}?`))fbDelDiaria(existingMap[day].diariaId);
            return;
          }
          // Toggle draft or cycle through obras
          if(calDraft[day]){
            const currentIdx=obrasAtivas.findIndex(o=>o.id===calDraft[day]);
            const nextIdx=(currentIdx+1)%obrasAtivas.length;
            if(currentIdx===obrasAtivas.length-1){
              // Cycled through all — remove
              const newDraft={...calDraft};delete newDraft[day];setCalDraft(newDraft);
            } else {
              setCalDraft({...calDraft,[day]:obrasAtivas[nextIdx].id});
            }
          } else {
            setCalDraft({...calDraft,[day]:obrasAtivas[0]?.id||""});
          }
        };

        const saveDrafts=()=>{
          const toSave=Object.entries(calDraft).filter(([day,obraId])=>obraId&&!existingMap[parseInt(day)]);
          toSave.forEach(([day,obraId])=>{
            const dateStr=`${eqMes}-${String(day).padStart(2,"0")}`;
            fbAddDiaria({equipeId:calEq,obraId,data:dateStr});
          });
          setCalDraft({});
          if(toSave.length>0)showToast(`${toSave.length} diárias salvas`);
        };

        return(<>
        <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
          <select value={eqMes} onChange={e=>{setEqMes(e.target.value);setCalDraft({});}} style={{...selectStyle,padding:"10px 16px",fontSize:13}}>{["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"].map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}</select>
          <span style={{fontSize:12,color:C.textDim}}>{diariasMes.length} diárias no mês — {R$(custoDiarioTotal)}</span>
        </div>

        {/* Collaborator selector */}
        <div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Selecione o Colaborador</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {diaristas.map((d,i)=>{const dias=diariasMes.filter(x=>x.equipeId===d.id).length;return(
              <button key={d.id} onClick={()=>{setCalEq(d.id);setCalDraft({});}} style={{padding:"10px 16px",borderRadius:12,border:`1px solid ${calEq===d.id?C.gold+"66":C.border}`,background:calEq===d.id?C.accentGlow:"transparent",color:calEq===d.id?C.gold:C.textMuted,fontSize:12,fontWeight:calEq===d.id?700:500,cursor:"pointer",transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:90}}>
                <span style={{fontWeight:700}}>{d.nome}</span>
                <span style={{fontSize:10,opacity:0.7}}>{d.funcao} · {dias}d</span>
              </button>
            );})}
          </div>
        </div>

        {calEq&&selectedStaff&&(<>
          {/* Calendar header info */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:18,fontWeight:800}}>{selectedStaff.nome}</span>
              <Badge text={selectedStaff.funcao} color={C.amber}/>
              <span style={{fontSize:13,color:C.textDim}}>Diária: <b style={{color:C.gold}}>{R$(selectedStaff.valorDiaria)}</b></span>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:14,fontWeight:700,color:C.gold}}>{totalDias} dias · {R$(totalValor)}</span>
            </div>
          </div>

          {/* Obra legend */}
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:C.textDim,fontWeight:600,alignSelf:"center"}}>OBRAS:</span>
            {obrasAtivas.map((o,i)=>(<div key={o.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:palette[i%palette.length]+"18",border:`1px solid ${palette[i%palette.length]}33`}}>
              <div style={{width:8,height:8,borderRadius:3,background:palette[i%palette.length]}}/><span style={{fontSize:11,color:palette[i%palette.length],fontWeight:600}}>{o.nome.replace("OBRA ","")}</span>
            </div>))}
            <span style={{fontSize:10,color:C.textDim,alignSelf:"center",marginLeft:8}}>Clique no dia para atribuir obra · clique novamente para trocar</span>
          </div>

          {/* Calendar grid */}
          <div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
              {dayNames.map(d=>(<div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:d==="Dom"?C.red+"88":C.textDim,padding:"6px 0"}}>{d}</div>))}
            </div>
            {/* Day cells */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {/* Empty cells for first week offset */}
              {Array.from({length:firstDayOfWeek}).map((_,i)=>(<div key={`e${i}`}/>))}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1;
                const dow=new Date(year,month-1,day).getDay();
                const isSunday=dow===0;
                const entry=allDays[day];
                const obraIdx=entry?obrasAtivas.findIndex(o=>o.id===entry.obraId):-1;
                const obraColor=obraIdx>=0?palette[obraIdx%palette.length]:null;
                const obraNome=entry?obrasAtivas.find(o=>o.id===entry.obraId)?.nome?.replace("OBRA ",""):"";
                const isDraft=entry?.isDraft;
                return(
                  <div key={day} onClick={()=>handleDayClick(day)} style={{
                    position:"relative",padding:"8px 4px",borderRadius:10,textAlign:"center",cursor:isSunday?"default":"pointer",
                    background:entry?obraColor+"22":isSunday?C.bg+"88":"transparent",
                    border:`1.5px solid ${entry?(isDraft?obraColor+"88":obraColor+"55"):isSunday?"transparent":C.border+"55"}`,
                    transition:"all 0.15s",minHeight:56,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    opacity:isSunday?0.35:1,
                  }}>
                    <span style={{fontSize:14,fontWeight:entry?800:500,color:entry?obraColor:isSunday?C.red:C.text}}>{day}</span>
                    {obraNome&&<span style={{fontSize:8,color:obraColor,fontWeight:700,marginTop:2,lineHeight:1,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{obraNome}</span>}
                    {isDraft&&<div style={{position:"absolute",top:3,right:3,width:5,height:5,borderRadius:3,background:C.amber}}/>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          {draftCount>0&&(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 24px",borderRadius:14,background:C.amber+"12",border:`1px solid ${C.amber}33`,marginBottom:16}}>
              <span style={{fontSize:13,fontWeight:700,color:C.amber}}>{draftCount} diárias novas para salvar</span>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setCalDraft({})} style={{...btnGhost,borderColor:C.amber+"44",color:C.amber,fontSize:12}}>Limpar</button>
                <button onClick={saveDrafts} style={{...btnPrimary,fontSize:13}}>Salvar {draftCount} Diárias</button>
              </div>
            </div>
          )}

          {/* Summary below calendar */}
          <div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 20px"}}>
            <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Resumo — {selectedStaff.nome} em {eqMes.replace("-","/")}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {obrasAtivas.map((o,i)=>{const dias=Object.values(allDays).filter(d=>d.obraId===o.id).length;if(!dias)return null;return(
                <div key={o.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:palette[i%palette.length]+"15",border:`1px solid ${palette[i%palette.length]}33`}}>
                  <div style={{width:8,height:8,borderRadius:3,background:palette[i%palette.length]}}/><span style={{fontSize:12,fontWeight:600,color:palette[i%palette.length]}}>{o.nome.replace("OBRA ","")}:</span><span style={{fontSize:12,fontWeight:800}}>{dias}d · {R$(dias*(selectedStaff.valorDiaria||0))}</span>
                </div>
              );})}
            </div>
          </div>
        </>)}

        {!calEq&&(<div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:"48px 40px",textAlign:"center"}}><p style={{fontSize:32,marginBottom:12}}>📅</p><p style={{fontSize:15,color:C.textMuted,fontWeight:600}}>Selecione um colaborador acima para abrir o calendário</p></div>)}
        </>);
      })()}

      {/* ── PAGAMENTOS ── */}
      {eqTab==="pagamentos"&&(<>
        <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
          <select value={eqMes} onChange={e=>setEqMes(e.target.value)} style={{...selectStyle,padding:"8px 14px",fontSize:13}}>{["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"].map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}</select>
        </div>
        {/* KPIs pagamento */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:16}}>
          <MetricCard small label="Devido no Mês" value={R$(devidoTotal)} color={C.amber} sub={`Fixos: ${R$(totalSalarios)} + Diárias: ${R$(custoDiarioTotal)}`}/>
          <MetricCard small label="Já Pago" value={R$(totalPagoMes)} color={C.green} sub={`${pagMes.length} pagamentos`}/>
          <MetricCard small label="Saldo Devedor" value={R$(Math.max(0,saldoDevedor))} color={saldoDevedor>0?C.red:C.green} sub={saldoDevedor<=0?"Tudo pago ✓":"Pendente"}/>
          <MetricCard small label="% Pago" value={devidoTotal>0?pct(totalPagoMes/devidoTotal):"—"} color={totalPagoMes>=devidoTotal?C.green:C.amber}/>
        </div>
        {/* Quick add payment */}
        {isAdmin&&(<div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Registrar Pagamento</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{minWidth:180}}><label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Funcionário</label><select value={newPag.equipeId} onChange={e=>setNewPag(p=>({...p,equipeId:e.target.value}))} style={{...selectStyle,padding:"8px 12px",fontSize:12,width:"100%"}}><option value="">Selecione...</option>{staffList.map(s=><option key={s.id} value={s.id}>{s.nome} ({s.tipo==="mensalista"?"Mensal":"Diária"})</option>)}</select></div>
            <div style={{minWidth:120}}><label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Valor (R$)</label><input type="number" step="0.01" value={newPag.valor} onChange={e=>setNewPag(p=>({...p,valor:e.target.value}))} style={{...inputStyle,padding:"8px 12px",fontSize:12}}/></div>
            <div style={{minWidth:140}}><label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Data Pagamento</label><input type="date" value={newPag.data} onChange={e=>setNewPag(p=>({...p,data:e.target.value}))} style={{...inputStyle,padding:"8px 12px",fontSize:12}}/></div>
            <div style={{minWidth:140}}><label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Obs (ex: 1a quinzena)</label><input value={newPag.obs} onChange={e=>setNewPag(p=>({...p,obs:e.target.value}))} style={{...inputStyle,padding:"8px 12px",fontSize:12}} placeholder="1a quinzena"/></div>
            <button onClick={()=>{if(newPag.equipeId&&newPag.valor){const staff=staffList.find(s=>s.id===newPag.equipeId);fbAddPag({...newPag,valor:parseFloat(newPag.valor),equipeNome:staff?.nome||"",referencia:eqMes});setNewPag(p=>({...p,valor:"",obs:""}));}}} style={{...btnPrimary,padding:"8px 16px",fontSize:12}}>＋ Pagar</button>
          </div>
        </div>)}
        {/* Per-person payment status */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Status de Pagamento — {eqMes.replace("-","/")}</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Nome</TH><TH>Tipo</TH><TH align="right">Devido</TH><TH align="right">Pago</TH><TH align="right">Saldo</TH><TH>Status</TH><TH>Detalhes</TH></tr></thead>
          <tbody>{Object.values(pagPorPessoa).filter(p=>p.devido>0||p.totalPago>0).sort((a,b)=>b.saldo-a.saldo).map(p=>(<tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <TD bold>{p.nome}</TD>
            <TD><Badge text={p.tipo==="mensalista"?"MENSAL":"DIÁRIA"} color={p.tipo==="mensalista"?C.purple:C.amber}/></TD>
            <TD mono align="right">{R$(p.devido)}</TD>
            <TD mono align="right" color={C.green}>{R$(p.totalPago)}</TD>
            <TD mono bold align="right" color={p.saldo>0?C.red:C.green}>{p.saldo>0?R$(p.saldo):"QUITADO"}</TD>
            <TD><Badge text={p.saldo<=0?"PAGO":p.totalPago>0?"PARCIAL":"PENDENTE"} color={p.saldo<=0?C.green:p.totalPago>0?C.amber:C.red}/></TD>
            <TD color={C.textDim}><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{p.pags.map(pg=>(<span key={pg.id} style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:C.green+"18",color:C.green,display:"inline-flex",alignItems:"center",gap:4}}>{fmtD(pg.data)} · {R$(pg.valor)}{pg.obs?` · ${pg.obs}`:""}{isAdmin&&<button onClick={()=>fbDelPag(pg.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10,padding:0,marginLeft:2}}>✕</button>}</span>))}{p.pags.length===0&&<span style={{fontSize:11}}>—</span>}</div></TD>
          </tr>))}</tbody></table></div>
        </div>
        {/* Payment history */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Histórico de Pagamentos — {eqMes.replace("-","/")}</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Data</TH><TH>Funcionário</TH><TH align="right">Valor</TH><TH>Obs</TH>{isAdmin&&<TH></TH>}</tr></thead>
          <tbody>{pagMes.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(p=>(<tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <TD>{fmtD(p.data)}</TD><TD bold>{p.equipeNome||staffList.find(s=>s.id===p.equipeId)?.nome||"?"}</TD><TD mono bold align="right" color={C.green}>{R$(p.valor)}</TD><TD color={C.textDim}>{p.obs||"—"}</TD>
            {isAdmin&&<TD><button onClick={()=>fbDelPag(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></TD>}
          </tr>))}{pagMes.length===0&&<tr><td colSpan={5} style={{padding:24,textAlign:"center",color:C.textDim}}>Nenhum pagamento registrado</td></tr>}</tbody></table></div>
        </div>
      </>)}

      {/* ── RESUMO POR OBRA ── */}
      {eqTab==="resumo"&&(<>
        <div style={{display:"flex",gap:8,marginBottom:16}}><select value={eqMes} onChange={e=>setEqMes(e.target.value)} style={{...selectStyle,padding:"8px 14px",fontSize:13}}>{["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"].map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}</select></div>
        {/* Diaristas payment summary */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Pagamento Diaristas — {eqMes.replace("-","/")}</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Nome</TH><TH>Função</TH><TH align="right">Diária</TH><TH align="right">Dias</TH>{obrasAtivas.map(o=><TH key={o.id} align="right">{o.nome.replace("OBRA ","")}</TH>)}<TH align="right">Total a Pagar</TH></tr></thead>
          <tbody>{resumoDiaristas.map(d=>(<tr key={d.id}><TD bold>{d.nome}</TD><TD><Badge text={d.funcao} color={C.amber}/></TD><TD mono align="right">{R$(d.valorDiaria)}</TD><TD mono bold align="right">{d.totalDias}</TD>{obrasAtivas.map(o=><TD key={o.id} mono align="right" color={d.porObra[o.id]?C.text:C.textDim}>{d.porObra[o.id]||"—"}</TD>)}<TD mono bold align="right" color={C.green}>{R$(d.custoTotal)}</TD></tr>))}
          <tr style={{borderTop:`2px solid ${C.border}`}}><TD bold>TOTAL DIARISTAS</TD><TD/><TD/><TD mono bold align="right">{resumoDiaristas.reduce((s,d)=>s+d.totalDias,0)}</TD>{obrasAtivas.map(o=><TD key={o.id} mono bold align="right">{resumoDiaristas.reduce((s,d)=>s+(d.porObra[o.id]||0),0)}</TD>)}<TD mono bold align="right" color={C.green}>{R$(custoDiarioTotal)}</TD></tr>
          </tbody></table></div>
        </div>
        {/* Mensalistas rateio */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Rateio Mensalistas — Dividido igualmente entre {obrasAtivas.length} obras</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Nome</TH><TH>Função</TH><TH align="right">Salário</TH><TH align="right">Rateio/Obra</TH></tr></thead>
          <tbody>{mensalistas.map(m=>(<tr key={m.id}><TD bold>{m.nome}</TD><TD><Badge text={m.funcao} color={C.purple}/></TD><TD mono align="right">{R$(m.salario)}</TD><TD mono align="right" color={C.accent}>{R$(rateioMensal>0?(m.salario||0)/obrasAtivas.length:0)}</TD></tr>))}
          <tr style={{borderTop:`2px solid ${C.border}`}}><TD bold>TOTAL MENSALISTAS</TD><TD/><TD mono bold align="right">{R$(totalSalarios)}</TD><TD mono bold align="right" color={C.accent}>{R$(rateioMensal)}</TD></tr>
          </tbody></table></div>
        </div>
        {/* Custo MO por obra */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Custo Total MO por Obra — {eqMes.replace("-","/")}</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Obra</TH><TH align="right">Diaristas</TH><TH align="right">Mensalistas</TH><TH align="right">Total MO</TH><TH>% do Contrato</TH></tr></thead>
          <tbody>{obrasAtivas.map(o=>{const custoDiar=diaristas.reduce((s,d)=>{const dias=getDiariasCount(d.id,o.id,eqMes);return s+dias*(d.valorDiaria||0);},0);const custoMens=rateioMensal;const totalMO=custoDiar+custoMens;const pctContrato=o.contrato>0?totalMO/o.contrato:0;
          return(<tr key={o.id}><TD bold>{o.nome}</TD><TD mono align="right">{R$(custoDiar)}</TD><TD mono align="right">{R$(custoMens)}</TD><TD mono bold align="right" color={C.amber}>{R$(totalMO)}</TD><TD><Badge text={pct(pctContrato)} color={pctContrato>0.05?C.red:C.green}/></TD></tr>);})}</tbody></table></div>
        </div>
      </>)}
    </div>);
  };

  // ── STAFF FORM ──
  const StaffForm=({initial,onClose})=>{
    const[f,setF]=useState(initial||{nome:"",funcao:"PEDREIRO",tipo:"diarista",valorDiaria:"",salario:""});
    const doSave=()=>{if(!f.nome)return;const d={...f,valorDiaria:parseFloat(f.valorDiaria)||0,salario:parseFloat(f.salario)||0};if(initial)fbEditStaff(initial.id,d);else fbAddStaff(d);onClose();};
    return(<Modal title={initial?"Editar Funcionário":"Novo Funcionário"} onClose={onClose}>
      <Field label="Nome"><input value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value.toUpperCase()}))} style={inputStyle}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Função"><select value={f.funcao} onChange={e=>setF(p=>({...p,funcao:e.target.value}))} style={selectStyle}>{FUNCOES.map(fn=><option key={fn}>{fn}</option>)}</select></Field>
        <Field label="Tipo"><select value={f.tipo} onChange={e=>setF(p=>({...p,tipo:e.target.value}))} style={selectStyle}><option value="diarista">Diarista</option><option value="mensalista">Mensalista</option></select></Field>
      </div>
      {f.tipo==="diarista"?(<Field label="Valor da Diária (R$)"><input type="number" step="0.01" value={f.valorDiaria} onChange={e=>setF(p=>({...p,valorDiaria:e.target.value}))} style={inputStyle}/></Field>)
      :(<Field label="Salário Mensal (R$)"><input type="number" step="0.01" value={f.salario} onChange={e=>setF(p=>({...p,salario:e.target.value}))} style={inputStyle}/></Field>)}
      <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Cadastrar"}</button>
    </Modal>);
  };

  // ─── COBRANÇA FORM ───
  const CobForm=({initial,onClose})=>{
    const[f,setF]=useState(initial||{data:new Date().toISOString().slice(0,10),cliente:"",valor:"",status:"A VENCER",obs:"",dataRecebimento:""});
    const doSave=()=>{if(!f.cliente||!f.valor)return;const d={...f,valor:parseFloat(f.valor)};if(d.status==="RECEBIDO"&&!d.dataRecebimento)d.dataRecebimento=d.data;if(initial)fbEditCob(initial.id,d);else fbAddCob(d);onClose();};
    return(<Modal title={initial?"Editar Cobrança":"Nova Cobrança"} onClose={onClose}>
      <Field label="Cliente / Obra"><input value={f.cliente} onChange={e=>setF(p=>({...p,cliente:e.target.value}))} style={inputStyle} placeholder="Ex: HL 227"/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Valor (R$)"><input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/></Field>
        <Field label="Data Prevista"><input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/></Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Status"><select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={selectStyle}>{FAT_STATUS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
        <Field label="Data Recebimento (real)"><input type="date" value={f.dataRecebimento||""} onChange={e=>setF(p=>({...p,dataRecebimento:e.target.value}))} style={inputStyle}/></Field>
      </div>
      <Field label="Observação"><input value={f.obs} onChange={e=>setF(p=>({...p,obs:e.target.value}))} style={inputStyle}/></Field>
      <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>{initial?"Salvar":"Registrar"}</button>
    </Modal>);
  };

  // ─── FATURAMENTO PAGE (PREMIUM) ───
  const FatPage=()=>{
    const[fatTab,setFatTab]=useState("visao");
    const[fatFiltro,setFatFiltro]=useState("todos");
    const[fatMes,setFatMes]=useState("todos");
    const cobsSorted=cobs.sort((a,b)=>(a.data||"").localeCompare(b.data||""));
    const cobsFilt=(()=>{let r=cobsSorted;if(fatFiltro!=="todos")r=r.filter(c=>c.status===fatFiltro);if(fatMes!=="todos")r=r.filter(c=>c.data?.startsWith(fatMes));return r;})();
    // Monthly breakdown
    const MESES_LABEL=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
    const mesData=MESES_LABEL.map((_,i)=>{const m=`2026-${String(i+1).padStart(2,"0")}`;const all=cobs.filter(c=>c.data?.startsWith(m));const rec=all.filter(c=>c.status==="RECEBIDO").reduce((s,c)=>s+(c.valor||0),0);const prev=all.reduce((s,c)=>s+(c.valor||0),0);const venc=all.filter(c=>c.status==="VENCIDO").reduce((s,c)=>s+(c.valor||0),0);const prox=all.filter(c=>c.status==="PROXIMO"||c.status==="A VENCER").reduce((s,c)=>s+(c.valor||0),0);return{m,label:MESES_LABEL[i],rec,prev,venc,prox,count:all.length};});
    const maxMes=Math.max(...mesData.map(m=>m.prev),1);
    // Per-client aggregation
    const clienteAgg={};cobs.forEach(c=>{if(!clienteAgg[c.cliente])clienteAgg[c.cliente]={nome:c.cliente,total:0,recebido:0,pendente:0,vencido:0,count:0};clienteAgg[c.cliente].total+=(c.valor||0);clienteAgg[c.cliente].count++;if(c.status==="RECEBIDO")clienteAgg[c.cliente].recebido+=(c.valor||0);else if(c.status==="VENCIDO")clienteAgg[c.cliente].vencido+=(c.valor||0);else clienteAgg[c.cliente].pendente+=(c.valor||0);});
    const topClientes=Object.values(clienteAgg).sort((a,b)=>b.total-a.total).slice(0,10);
    // Accumulator for cash flow
    let acum=0;const cashFlow=mesData.map(m=>{acum+=m.rec;return{...m,acumulado:acum};});
    const clientesAtivos=clientes.filter(c=>c.status!=="QUITADO");
    const clientesAtraso=clientes.filter(c=>c.status==="EM ATRASO");
    const nfTotal=nfsList.reduce((s,n)=>s+(n.valor||0),0);
    const recAcum=cobs.filter(c=>c.status==="RECEBIDO").reduce((s,c)=>s+(c.valor||0),0);
    const prevTotal=cobs.reduce((s,c)=>s+(c.valor||0),0);
    // Próximos 30 dias
    const hoje=new Date("2026-04-15");const em30=new Date(hoje);em30.setDate(em30.getDate()+30);
    const prox30=cobs.filter(c=>{if(c.status==="RECEBIDO")return false;const d=new Date(c.data);return d>=hoje&&d<=em30;}).sort((a,b)=>(a.data||"").localeCompare(b.data||""));
    const prox30Total=prox30.reduce((s,c)=>s+(c.valor||0),0);

    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}><div><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>💰 Faturamento & Recebíveis</h2><p style={{fontSize:13,color:C.textDim,marginTop:4}}>Controle de cobranças, medições e portfólio — {clientes.length} obras</p></div>{isAdmin&&<button onClick={()=>setModal({type:"cobForm"})} style={btnPrimary}>＋ Nova Cobrança</button>}</div>

      {/* TOP KPIs - 2 rows */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:12}}>
        <MetricCard label="Portfólio Total" value={R$(portfolioTotal)} color={C.accent} sub={`${clientes.length} obras contratadas`}/>
        <MetricCard label="Já Recebido (2026)" value={R$(recAcum)} color={C.green} sub={prevTotal>0?`${pct(recAcum/prevTotal)} do previsto`:""}/>
        <MetricCard label="A Receber Total" value={R$(portfolioAReceber)} color={C.cyan}/>
        <MetricCard label="Próximos 30 dias" value={R$(prox30Total)} color={C.amber} sub={`${prox30.length} cobranças`}/>
        <MetricCard label="Vencido" value={R$(totalVencido)} color={totalVencido>0?C.red:C.green} sub={totalVencido>0?"⚠️ COBRAR":"Nenhum"}/>
        <MetricCard label="NFs Emitidas" value={R$(nfTotal)} color={C.purple} sub={`${nfsList.length} notas`}/>
      </div>

      {/* Tab selector */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>{[{id:"visao",label:"📊 Visão Geral"},{id:"cronograma",label:"📅 Cronograma Mensal"},{id:"agenda",label:"📋 Agenda de Cobranças"},{id:"portfolio",label:"🏢 Portfólio"},{id:"nfs",label:"📄 NFs"}].map(t=>(<button key={t.id} onClick={()=>setFatTab(t.id)} style={{padding:"9px 16px",borderRadius:10,border:`1px solid ${fatTab===t.id?C.accent+"66":C.border}`,background:fatTab===t.id?C.accentGlow:"transparent",color:fatTab===t.id?C.accent:C.textMuted,fontSize:12,fontWeight:fatTab===t.id?700:500,cursor:"pointer"}}>{t.label}</button>))}</div>

      {/* ── VISÃO GERAL ── */}
      {fatTab==="visao"&&(<>
        {/* Vencidos alert */}
        {totalVencido>0&&(<div style={{background:C.red+"12",borderRadius:16,border:`1px solid ${C.red}33`,padding:"18px 24px",marginBottom:16}}><p style={{fontSize:15,fontWeight:800,color:C.red}}>🚨 {cobs.filter(c=>c.status==="VENCIDO").length} cobranças vencidas — {R$(totalVencido)}</p><div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:8}}>{cobs.filter(c=>c.status==="VENCIDO").map(c=>(<div key={c.id} style={{padding:"6px 12px",borderRadius:8,background:C.red+"18",fontSize:12}}><span style={{fontWeight:700,color:C.red}}>{c.cliente}</span><span style={{color:C.textMuted,marginLeft:8}}>{R$(c.valor)}</span></div>))}</div></div>)}

        {/* Próximos 30 dias */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>📅 Próximas cobranças (30 dias) — {R$(prox30Total)}</p>
          <div style={{display:"grid",gap:6}}>{prox30.slice(0,8).map(c=>(<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:12,color:C.textMuted,fontFamily:"'JetBrains Mono',monospace",minWidth:70}}>{fmtD(c.data)}</span><span style={{fontSize:13,fontWeight:700}}>{c.cliente}</span></div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:C.accent}}>{R$(c.valor)}</span><Badge text={c.status} color={FAT_STATUS_COLOR[c.status]||C.textMuted}/></div></div>))}{prox30.length>8&&<p style={{fontSize:11,color:C.textDim,textAlign:"center",marginTop:4}}>+ {prox30.length-8} cobranças</p>}</div>
        </div>

        {/* Top 10 clients by value */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
            <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Top 10 Clientes por Valor</p>
            {topClientes.map((c,i)=>(<div key={c.nome} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<topClientes.length-1?`1px solid ${C.border}08`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,fontWeight:800,color:C.textDim,width:18}}>{i+1}</span><span style={{fontSize:12,fontWeight:600}}>{c.nome}</span></div>
              <div style={{textAlign:"right"}}><span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(c.total)}</span>{c.vencido>0&&<span style={{fontSize:10,color:C.red,marginLeft:6}}>⚠️</span>}</div>
            </div>))}
          </div>
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
            <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>Distribuição por Status</p>
            <div style={{marginBottom:20}}><Donut segments={[{value:recAcum,color:C.green},{value:totalAVencer,color:C.accent},{value:totalProximo,color:C.amber},{value:totalVencido,color:C.red}]} label="Total 2026" size={140}/></div>
            {[{label:"Recebido",val:recAcum,color:C.green},{label:"A Vencer",val:totalAVencer,color:C.accent},{label:"Próximo",val:totalProximo,color:C.amber},{label:"Vencido",val:totalVencido,color:C.red}].map(s=>(<div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,background:s.color}}/><span style={{fontSize:12,color:C.textMuted}}>{s.label}</span></div><span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(s.val)}</span></div>))}
          </div>
        </div>
      </>)}

      {/* ── CRONOGRAMA MENSAL ── */}
      {fatTab==="cronograma"&&(<>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:20}}>Cronograma de Recebimentos 2026 — Previsto vs Recebido</p>
          {/* Bar chart */}
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:180,marginBottom:16,padding:"0 4px"}}>
            {mesData.map((m,i)=>{const hPrev=Math.max(4,(m.prev/maxMes)*160);const hRec=Math.max(0,(m.rec/maxMes)*160);const isPast=new Date(`2026-${String(i+1).padStart(2,"0")}-28`)<hoje;return(<div key={m.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:9,fontWeight:700,color:C.textMuted,marginBottom:4}}>{m.prev>0?R$(m.prev).replace("R$\u00a0",""):"—"}</span>
              <div style={{width:"100%",position:"relative",height:hPrev}}>
                <div style={{position:"absolute",bottom:0,width:"100%",height:hPrev,background:C.border,borderRadius:"4px 4px 0 0",opacity:0.5}}/>
                <div style={{position:"absolute",bottom:0,width:"100%",height:hRec,background:isPast?C.green:C.accent+"44",borderRadius:"4px 4px 0 0",transition:"height 0.5s ease"}}/>
              </div>
              <span style={{fontSize:10,fontWeight:700,color:i===3?C.accent:C.textDim,marginTop:4}}>{m.label}</span>
            </div>);})}
          </div>
          <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:8,borderRadius:2,background:C.green}}/><span style={{fontSize:11,color:C.textMuted}}>Recebido</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:8,borderRadius:2,background:C.border}}/><span style={{fontSize:11,color:C.textMuted}}>Previsto</span></div>
          </div>
        </div>
        {/* Monthly detail cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
          {mesData.filter(m=>m.prev>0).map((m,i)=>{const isPast=new Date(`2026-${String(i+1).padStart(2,"0")}-28`)<hoje;return(<div key={m.label} style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,padding:"16px 20px",borderTop:`3px solid ${m.venc>0?C.red:isPast?C.green:C.accent}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:14,fontWeight:800}}>{m.label}</span><span style={{fontSize:11,color:C.textDim}}>{m.count} cobranças</span></div>
            <p style={{fontSize:20,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:isPast?C.green:C.text,marginBottom:8}}>{R$(m.prev)}</p>
            {m.rec>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.green}}>✓ Recebido</span><span style={{fontWeight:700,color:C.green}}>{R$(m.rec)}</span></div>}
            {m.prox>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.amber}}>◷ Pendente</span><span style={{fontWeight:700,color:C.amber}}>{R$(m.prox)}</span></div>}
            {m.venc>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:C.red}}>⚠ Vencido</span><span style={{fontWeight:700,color:C.red}}>{R$(m.venc)}</span></div>}
            {m.prev>0&&<div style={{marginTop:8}}><ProgressBar value={m.rec} max={m.prev} color={isPast?C.green:C.accent} height={5}/></div>}
          </div>);})}
        </div>
        {/* Cash flow acumulado */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginTop:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Fluxo de Caixa Acumulado (Recebido)</p>
          <Spark data={cashFlow.map(m=>m.acumulado)} color={C.green} w={500} h={50}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>{cashFlow.filter(m=>m.acumulado>0).map(m=>(<div key={m.label} style={{textAlign:"center"}}><p style={{fontSize:10,color:C.textDim}}>{m.label}</p><p style={{fontSize:11,fontWeight:700,color:C.green}}>{R$(m.acumulado).replace("R$\u00a0","")}</p></div>))}</div>
        </div>
      </>)}

      {/* ── AGENDA ── */}
      {fatTab==="agenda"&&(<>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <select value={fatFiltro} onChange={e=>setFatFiltro(e.target.value)} style={{...selectStyle,padding:"8px 12px",fontSize:12}}><option value="todos">Todos os status</option>{FAT_STATUS.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <select value={fatMes} onChange={e=>setFatMes(e.target.value)} style={{...selectStyle,padding:"8px 12px",fontSize:12}}><option value="todos">Todos os meses</option>{[...new Set(cobs.map(c=>c.data?.slice(0,7)).filter(Boolean))].sort().map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}</select>
          <span style={{fontSize:12,color:C.textDim,display:"flex",alignItems:"center"}}>{cobsFilt.length} resultados — {R$(cobsFilt.reduce((s,c)=>s+(c.valor||0),0))}</span>
        </div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Data</TH><TH>Cliente / Obra</TH><TH align="right">Valor</TH><TH>Status</TH><TH>Obs</TH>{isAdmin&&<TH></TH>}</tr></thead><tbody>{cobsFilt.map(c=>(<tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD>{fmtD(c.data)}</TD><TD bold>{c.cliente}</TD><TD mono bold align="right">{R$(c.valor)}</TD><TD>{c.status!=="RECEBIDO"&&isAdmin?<button onClick={()=>fbStatusCob(c.id,"RECEBIDO")} style={{background:C.green+"18",border:`1px solid ${C.green}33`,borderRadius:8,padding:"4px 10px",cursor:"pointer",color:C.green,fontSize:10,fontWeight:700,transition:"all 0.2s"}}>✓ Marcar Recebido</button>:<Badge text={c.status} color={FAT_STATUS_COLOR[c.status]||C.textMuted}/>}</TD><TD color={C.textDim}>{c.obs||"—"}</TD>{isAdmin&&<TD><div style={{display:"flex",gap:4}}><button onClick={()=>setModal({type:"cobEdit",cob:c})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button><button onClick={()=>fbDelCob(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></div></TD>}</tr>))}</tbody></table></div></div>
      </>)}

      {/* ── PORTFÓLIO ── */}
      {fatTab==="portfolio"&&(<>
        {clientesAtraso.length>0&&(<div style={{background:C.red+"12",borderRadius:16,border:`1px solid ${C.red}33`,padding:"16px 24px",marginBottom:16}}><p style={{fontSize:14,fontWeight:800,color:C.red}}>🚨 {clientesAtraso.length} obras em atraso</p>{clientesAtraso.map(c=>(<p key={c.id} style={{fontSize:12,color:C.textMuted,marginTop:4}}>• {c.nome} — saldo: {R$((c.contrato||0)-(c.pagoPre||0))}</p>))}</div>)}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Obras em Andamento / Atraso ({clientesAtivos.length})</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Obra</TH><TH>Ano</TH><TH align="right">Contrato</TH><TH align="right">Pago</TH><TH align="right">Saldo</TH><TH>%</TH><TH>Status</TH></tr></thead><tbody>{clientesAtivos.sort((a,b)=>(b.contrato||0)-(a.contrato||0)).map(c=>{const cobRec=cobs.filter(x=>x.cliente===c.nome&&x.status==="RECEBIDO").reduce((s,x)=>s+(x.valor||0),0);const totalPago=(c.pagoPre||0)+cobRec;const saldo=(c.contrato||0)-totalPago;const pctPago=c.contrato>0?totalPago/c.contrato:0;const sc=c.status==="EM ATRASO"?C.red:pctPago>=0.9?C.green:pctPago>=0.5?C.accent:C.amber;return(<tr key={c.id}><TD bold>{c.nome}</TD><TD>{c.ano}</TD><TD mono align="right">{R$(c.contrato)}</TD><TD mono align="right" color={C.green}>{R$(totalPago)}</TD><TD mono bold align="right" color={saldo>0?C.amber:C.green}>{R$(saldo)}</TD><TD><div style={{width:60}}><ProgressBar value={pctPago} max={1} color={sc} height={6}/><span style={{fontSize:10,color:C.textDim}}>{pct(pctPago)}</span></div></TD><TD><Badge text={c.status} color={c.status==="EM ATRASO"?C.red:C.accent}/></TD></tr>);})}</tbody></table></div>
        </div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px"}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Obras Quitadas ({clientes.filter(c=>c.status==="QUITADO").length})</p>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Obra</TH><TH>Ano</TH><TH align="right">Contrato</TH><TH>Status</TH></tr></thead><tbody>{clientes.filter(c=>c.status==="QUITADO").sort((a,b)=>b.ano-a.ano).map(c=>(<tr key={c.id}><TD>{c.nome}</TD><TD>{c.ano}</TD><TD mono align="right">{R$(c.contrato)}</TD><TD><Badge text="QUITADO" color={C.green}/></TD></tr>))}</tbody></table></div>
        </div>
      </>)}

      {/* ── NFs ── */}
      {fatTab==="nfs"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
          <MetricCard small label="Total Emitido" value={R$(nfTotal)} color={C.purple}/>
          <MetricCard small label="Notas Emitidas" value={nfsList.length+""} color={C.accent}/>
          <MetricCard small label="Média por NF" value={nfsList.length?R$(nfTotal/nfsList.length):"—"} color={C.amber}/>
        </div>
        {isAdmin&&(<div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Emitir Nova NF</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{minWidth:140}}><label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Data</label><input type="date" id="nf-data" defaultValue={new Date().toISOString().slice(0,10)} style={{...inputStyle,padding:"8px 12px",fontSize:12}}/></div>
            <div style={{minWidth:180}}><label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Cliente / Obra</label><input id="nf-cliente" placeholder="Ex: NAU KLABIN 1607" style={{...inputStyle,padding:"8px 12px",fontSize:12}}/></div>
            <div style={{minWidth:120}}><label style={{fontSize:10,color:C.textDim,display:"block",marginBottom:4}}>Valor NF (R$)</label><input type="number" id="nf-valor" step="0.01" style={{...inputStyle,padding:"8px 12px",fontSize:12}}/></div>
            <button onClick={()=>{const d=document.getElementById("nf-data").value,c=document.getElementById("nf-cliente").value,v=document.getElementById("nf-valor").value;if(c&&v){fbAddNf({data:d,cliente:c,valor:parseFloat(v)});document.getElementById("nf-cliente").value="";document.getElementById("nf-valor").value="";}}} style={{...btnPrimary,padding:"8px 16px",fontSize:12}}>＋ Emitir NF</button>
          </div>
        </div>)}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>#</TH><TH>Data</TH><TH>Cliente</TH><TH align="right">Valor NF</TH>{isAdmin&&<TH></TH>}</tr></thead><tbody>{nfsList.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map((n,i)=>(<tr key={n.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD color={C.textDim}>{i+1}</TD><TD>{fmtD(n.data)}</TD><TD bold>{n.cliente}</TD><TD mono bold align="right">{R$(n.valor)}</TD>{isAdmin&&<TD><button onClick={()=>fbDelNf(n.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></TD>}</tr>))}</tbody></table></div></div>
      </>)}
    </div>);
  };

  const KPIsPage=()=>(<div>
    <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1,marginBottom:24}}>🎯 KPIs & Rentabilidade</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16,marginBottom:24}}>{obraKPIs.map(o=>{const sc=o.margem>=0.25?C.green:o.margem>=0.1?C.amber:C.red;const sl=o.margem>=0.25?"SAUDÁVEL":o.margem>=0.1?"ATENÇÃO":"CRÍTICO";return(<div key={o.id} style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 26px",borderTop:`3px solid ${o.color}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><p style={{fontSize:15,fontWeight:800}}>{o.nome}</p><Badge text={sl} color={sc}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,fontSize:12}}><div><span style={{color:C.textDim}}>Contrato</span><p style={{fontWeight:700,fontSize:15,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.contrato)}</p></div><div><span style={{color:C.textDim}}>Custo</span><p style={{fontWeight:700,fontSize:15,marginTop:2,color:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.custo)}</p></div><div><span style={{color:C.textDim}}>Lucro Bruto</span><p style={{fontWeight:700,fontSize:15,marginTop:2,color:o.lucroBruto>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.lucroBruto)}</p></div><div><span style={{color:C.textDim}}>Lucro Líq.</span><p style={{fontWeight:700,fontSize:15,marginTop:2,color:o.lucroLiq>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.lucroLiq)}</p></div><div><span style={{color:C.textDim}}>Margem Bruta</span><p style={{fontWeight:700,fontSize:15,marginTop:2,color:sc}}>{pct(o.margem)}</p></div><div><span style={{color:C.textDim}}>Margem Líq.</span><p style={{fontWeight:700,fontSize:15,marginTop:2,color:sc}}>{pct(o.margemLiq)}</p></div><div><span style={{color:C.textDim}}>ROI</span><p style={{fontWeight:700,fontSize:15,marginTop:2,color:C.purple}}>{pct(o.roi)}</p></div><div><span style={{color:C.textDim}}>Execução</span><div style={{marginTop:6}}><ProgressBar value={o.execucao} max={1} color={o.execucao>0.8?C.red:o.execucao>0.6?C.amber:C.green} height={8}/></div><p style={{fontSize:11,fontWeight:600,color:C.textMuted,marginTop:3}}>{pct(o.execucao)}</p></div></div>{(o.imposto>0||o.rtVal>0)&&(<div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,display:"flex",gap:20}}>{o.imposto>0&&<div><span style={{fontSize:10,color:C.textDim}}>Imposto</span><p style={{fontSize:13,fontWeight:700,color:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.imposto)}</p></div>}{o.rtVal>0&&<div><span style={{fontSize:10,color:C.textDim}}>RT</span><p style={{fontSize:13,fontWeight:700,color:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.rtVal)}</p></div>}<div><span style={{fontSize:10,color:C.textDim}}>Rec.Líq.</span><p style={{fontSize:13,fontWeight:700,color:C.cyan,fontFamily:"'JetBrains Mono',monospace"}}>{R$(o.recLiq)}</p></div></div>)}</div>);})}</div>
    <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px 28px",overflow:"hidden"}}><p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Matriz — Centro de Custo × Obra</p><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>C.Custo</TH>{obras.map(o=><TH key={o.id} align="right">{o.nome.replace("OBRA ","")}</TH>)}<TH align="right">Total</TH><TH align="right">%</TH></tr></thead><tbody>{CC_OBRA_DEFAULT.map(cc=>{const vals=obras.map(o=>obraLancs(o.id).filter(l=>l.centroCusto===cc).reduce((s,l)=>s+(l.valor||0),0));const total=vals.reduce((s,v)=>s+v,0);if(!total)return null;return(<tr key={cc}><TD bold>{cc}</TD>{vals.map((v,i)=><TD key={i} mono align="right" color={v>0?C.text:C.textDim}>{v>0?R$(v):"—"}</TD>)}<TD mono bold align="right">{R$(total)}</TD><TD align="right"><Badge text={custoTotalObras>0?pct(total/custoTotalObras):"—"} color={C.accent}/></TD></tr>);})}</tbody></table></div></div>
  </div>);

  // ── HISTORICO PAGE ──
  const HistoricoPage=()=>(<div>
    <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1,marginBottom:24}}>📝 Histórico de Alterações</h2>
    <p style={{fontSize:13,color:C.textDim,marginBottom:20}}>Registro de todas as ações realizadas no sistema — últimas 50 operações</p>
    <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Data/Hora</TH><TH>Usuário</TH><TH>Ação</TH><TH>Detalhe</TH></tr></thead>
    <tbody>{auditLogs.map(l=>(<tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <TD color={C.textDim}>{l.timestamp?new Date(l.timestamp).toLocaleString("pt-BR"):"—"}</TD>
      <TD bold>{l.usuario}</TD>
      <TD><Badge text={l.acao?.includes("removid")?"REMOVIDO":l.acao?.includes("criad")?"CRIADO":"EDITADO"} color={l.acao?.includes("removid")?C.red:l.acao?.includes("criad")?C.green:C.amber}/> <span style={{marginLeft:6}}>{l.acao}</span></TD>
      <TD color={C.textMuted}>{l.detalhe||"—"}</TD>
    </tr>))}{auditLogs.length===0&&<tr><td colSpan={4} style={{padding:32,textAlign:"center",color:C.textDim}}>Nenhuma alteração registrada ainda</td></tr>}</tbody></table></div></div>
  </div>);

  // ── OPERACIONAL PAGE (Combustível, Pedágio, Café) ──
  const OperPage=()=>{
    const[opMes,setOpMes]=useState("todos");
    const opLancs=lancs.filter(l=>l.tipo==="operacional");
    const opFilt=opMes==="todos"?opLancs:opLancs.filter(l=>l.data?.startsWith(opMes));
    const opTotal=opFilt.reduce((s,l)=>s+(l.valor||0),0);
    const opPorCC={};opLancs.forEach(l=>{opPorCC[l.centroCusto]=(opPorCC[l.centroCusto]||0)+(l.valor||0);});
    const opPorObra={};opLancs.forEach(l=>{const nome=obras.find(o=>o.id===l.obraId)?.nome||"Sem obra";opPorObra[nome]=(opPorObra[nome]||0)+(l.valor||0);});
    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><div><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>⛽ Custos Operacionais</h2><p style={{fontSize:13,color:C.textDim,marginTop:4}}>Combustível, pedágio, café da manhã e custos de campo</p></div>{isAdmin&&<button onClick={()=>setModal({type:"opForm"})} style={btnPrimary}>＋ Novo Lançamento</button>}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:20}}>
        <MetricCard small label="Total Operacional" value={R$(opLancs.reduce((s,l)=>s+(l.valor||0),0))} color={C.amber}/>
        <MetricCard small label="Lançamentos" value={opLancs.length+""} color={C.accent}/>
        <MetricCard small label="Média/Lançamento" value={opLancs.length?R$(opLancs.reduce((s,l)=>s+(l.valor||0),0)/opLancs.length):"—"} color={C.purple}/>
        <MetricCard small label="Rateio/Obra Ativa" value={_obrasAtivas.length?R$(opLancs.reduce((s,l)=>s+(l.valor||0),0)/_obrasAtivas.length):"—"} color={C.cyan}/>
      </div>
      {/* CC Breakdown */}
      <div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Por Tipo de Custo</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{Object.entries(opPorCC).sort((a,b)=>b[1]-a[1]).map(([cc,val],i)=>(<div key={cc} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}><div style={{width:8,height:8,borderRadius:4,background:palette[i%palette.length]}}/><span style={{fontSize:11,color:C.textMuted}}>{cc}</span><span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(val)}</span></div>))}</div>
      </div>
      {/* Por Obra */}
      {Object.keys(opPorObra).length>0&&(<div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Por Obra</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{Object.entries(opPorObra).sort((a,b)=>b[1]-a[1]).map(([ob,val],i)=>(<div key={ob} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}><div style={{width:8,height:8,borderRadius:4,background:palette[i%palette.length]}}/><span style={{fontSize:11,color:C.textMuted}}>{ob.replace("OBRA ","")}</span><span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(val)}</span></div>))}</div>
      </div>)}
      <select value={opMes} onChange={e=>setOpMes(e.target.value)} style={{...selectStyle,padding:"8px 12px",fontSize:12,marginBottom:12}}><option value="todos">Todos os meses</option>{meses.map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}</select>
      <div style={{background:`linear-gradient(135deg,${C.surface},${C.surfaceAlt})`,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>#</TH><TH>Descrição</TH><TH align="right">Valor</TH><TH>Data</TH><TH>Tipo</TH><TH>Obra</TH>{isAdmin&&<TH></TH>}</tr></thead>
      <tbody>{opFilt.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map((l,i)=>(<tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD color={C.textDim}>{i+1}</TD><TD bold>{l.descricao}</TD><TD mono bold align="right">{R$(l.valor)}</TD><TD>{fmtD(l.data)}</TD><TD><Badge text={l.centroCusto} color={C.amber}/></TD><TD color={C.textMuted}>{obras.find(o=>o.id===l.obraId)?.nome?.replace("OBRA ","")||"Rateado"}</TD>{isAdmin&&<TD><button onClick={()=>fbDelLanc(l.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></TD>}</tr>))}{opFilt.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:"center",color:C.textDim}}>Nenhum lançamento operacional</td></tr>}</tbody></table></div></div>
    </div>);
  };

  // ── OP FORM ──
  const OpForm=({onClose})=>{
    const[f,setF]=useState({descricao:"",valor:"",data:new Date().toISOString().slice(0,10),centroCusto:"COMBUSTÍVEL",obraId:_obrasAtivas[0]?.id||"",rateio:false});
    const doSave=()=>{if(!f.descricao||!f.valor)return;
      if(f.rateio){_obrasAtivas.forEach(o=>{fbAddLanc({descricao:f.descricao,valor:parseFloat(f.valor)/_obrasAtivas.length,data:f.data,centroCusto:f.centroCusto,obs:"Rateado entre obras",obraId:o.id,tipo:"operacional"});});}
      else{fbAddLanc({...f,valor:parseFloat(f.valor),tipo:"operacional",obs:""});}
      onClose();
    };
    return(<Modal title="Novo Custo Operacional" onClose={onClose}>
      <Field label="Descrição"><input value={f.descricao} onChange={e=>setF(p=>({...p,descricao:e.target.value}))} style={inputStyle} placeholder="Ex: Combustível Noel - semana 14"/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Valor (R$)"><input type="number" step="0.01" value={f.valor} onChange={e=>setF(p=>({...p,valor:e.target.value}))} style={inputStyle}/></Field>
        <Field label="Data"><input type="date" value={f.data} onChange={e=>setF(p=>({...p,data:e.target.value}))} style={inputStyle}/></Field>
      </div>
      <Field label="Tipo"><select value={f.centroCusto} onChange={e=>setF(p=>({...p,centroCusto:e.target.value}))} style={selectStyle}>{CC_OPER.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Obra"><select value={f.obraId} onChange={e=>setF(p=>({...p,obraId:e.target.value}))} style={selectStyle} disabled={f.rateio}>{_obrasAtivas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
        <Field label="Ratear entre obras?"><div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}><input type="checkbox" checked={f.rateio} onChange={e=>setF(p=>({...p,rateio:e.target.checked}))}/><span style={{fontSize:12,color:C.textMuted}}>Dividir igualmente entre {_obrasAtivas.length} obras ativas</span></div></Field>
      </div>
      <button onClick={doSave} style={{...btnPrimary,width:"100%",justifyContent:"center",marginTop:8,padding:"13px 0"}}>Registrar</button>
    </Modal>);
  };

  const renderPage=()=>{switch(page){case"dashboard":return<DashPage/>;case"obras":return<ObrasPage/>;case"faturamento":return<FatPage/>;case"funcionarios":return<EquipePage/>;case"operacional":return<OperPage/>;case"administrativo":return<LancPage tipo="administrativo" titulo="Administrativo" emoji="💼"/>;case"kpis":return<KPIsPage/>;case"historico":return<HistoricoPage/>;default:return<DashPage/>;}};

  // LancPage kept only for administrativo
  const LancPage=({tipo,titulo,emoji})=>{
    const ls=filterLancs(tipo);const total=ls.reduce((s,l)=>s+(l.valor||0),0);
    const ccB={};lancs.filter(l=>l.tipo===tipo).forEach(l=>{ccB[l.centroCusto]=(ccB[l.centroCusto]||0)+(l.valor||0);});
    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>{emoji} {titulo}</h2>{isAdmin&&<button onClick={()=>setModal({type:"lancForm",tipo})} style={btnPrimary}>＋ Lançamento</button>}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}><MetricCard small label="Total" value={R$(total)} color={C.amber}/><MetricCard small label="Lançamentos" value={ls.length+""} color={C.accent}/><MetricCard small label="Média" value={ls.length?R$(total/ls.length):"—"} color={C.purple}/></div>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:16}}><p style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>Por Centro de Custo</p><div style={{display:"flex",flexWrap:"wrap",gap:10}}>{Object.entries(ccB).sort((a,b)=>b[1]-a[1]).map(([cc,val],i)=>(<div key={cc} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}><div style={{width:8,height:8,borderRadius:4,background:palette[i%palette.length]}}/><span style={{fontSize:11,color:C.textMuted}}>{cc}</span><span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{R$(val)}</span></div>))}</div></div>
      <select value={filterMes} onChange={e=>setFilterMes(e.target.value)} style={{...selectStyle,padding:"8px 12px",fontSize:12,marginBottom:12}}><option value="todos">Todos</option>{meses.map(m=><option key={m} value={m}>{m.replace("-","/")}</option>)}</select>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>#</TH><TH>Descrição</TH><TH align="right">Valor</TH><TH>Data</TH><TH>C.Custo</TH><TH>Obs</TH>{isAdmin&&<TH></TH>}</tr></thead><tbody>{ls.map((l,i)=>(<tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD color={C.textDim}>{i+1}</TD><TD bold>{l.descricao}</TD><TD mono bold align="right">{R$(l.valor)}</TD><TD>{fmtD(l.data)}</TD><TD><Badge text={l.centroCusto} color={C.purple}/></TD><TD color={C.textDim}>{l.obs||"—"}</TD>{isAdmin&&<TD><div style={{display:"flex",gap:4}}><button onClick={()=>setModal({type:"lancEdit",lanc:l,tipo})} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14}}>✏️</button><button onClick={()=>fbDelLanc(l.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14}}>🗑️</button></div></TD>}</tr>))}</tbody></table></div></div>
    </div>);
  };
  return(<div style={{display:"flex",minHeight:"100vh",background:C.bg,color:C.text}}>
    {/* SIDEBAR - desktop */}
    <div style={{width:sideCollapsed?72:230,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"width 0.3s",flexShrink:0}} className="erp-side">
      <div style={{padding:sideCollapsed?"20px 16px":"20px 22px",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:`linear-gradient(135deg,${C.navy},#162449)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:C.gold,letterSpacing:-1,boxShadow:`0 4px 16px rgba(0,0,0,0.3)`,border:`1px solid ${C.gold}22`}}>FE</div>{!sideCollapsed&&<div><p style={{fontSize:15,fontWeight:800,lineHeight:1.2,color:C.text}}>Felt ERP</p><p style={{fontSize:10,color:C.gold,fontWeight:600}}>Gestão Executiva</p></div>}</div></div>
      {/* Search */}
      {!sideCollapsed&&<div style={{padding:"12px 16px"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...inputStyle,fontSize:12,padding:"8px 12px",background:C.bg}}/></div>}
      <nav style={{flex:1,padding:"4px 0",overflowY:"auto"}}>{navItems.map(it=>(<button key={it.id} onClick={()=>{setPage(it.id);setMobileNav(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideCollapsed?"12px 24px":"10px 22px",border:"none",cursor:"pointer",background:page===it.id?C.accentGlow:"transparent",color:page===it.id?C.gold:C.textMuted,fontSize:13,fontWeight:page===it.id?700:500,borderRight:page===it.id?`3px solid ${C.gold}`:"3px solid transparent",transition:"all 0.2s",justifyContent:sideCollapsed?"center":"flex-start"}}><span style={{fontSize:16}}>{it.emoji}</span>{!sideCollapsed&&it.label}</button>))}</nav>
      <button onClick={()=>setSideCollapsed(!sideCollapsed)} style={{padding:"10px",border:"none",borderTop:`1px solid ${C.border}`,background:"transparent",color:C.textDim,cursor:"pointer",fontSize:16}}>{sideCollapsed?"▸":"◂"}</button>
      <div style={{padding:sideCollapsed?"12px":"14px 22px",borderTop:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:10,justifyContent:sideCollapsed?"center":"flex-start"}}><div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:`linear-gradient(135deg,${C.navy},#162449)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:C.gold,border:`1px solid ${C.gold}33`}}>{user.avatar}</div>{!sideCollapsed&&<div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.nome}</p><p style={{fontSize:10,color:C.textDim,textTransform:"uppercase",fontWeight:600}}>{user.role}</p></div>}<button onClick={()=>setUser(null)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:16,padding:4}} title="Sair">⏻</button></div></div>
    </div>

    {/* MOBILE TOP BAR */}
    <div className="erp-mob-top" style={{display:"none",position:"fixed",top:0,left:0,right:0,zIndex:50,background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff"}}>FE</div><span style={{fontSize:15,fontWeight:800}}>Felt ERP</span></div>
      <button onClick={()=>setMobileNav(!mobileNav)} style={{background:"none",border:"none",color:C.text,fontSize:22,cursor:"pointer"}}>{mobileNav?"✕":"☰"}</button>
    </div>
    {/* MOBILE NAV DROPDOWN */}
    {mobileNav&&<div className="erp-mob-menu" style={{display:"none",position:"fixed",top:54,left:0,right:0,bottom:0,zIndex:49,background:C.surface+"f0",backdropFilter:"blur(10px)",padding:"12px 0"}}>
      <div style={{padding:"8px 16px"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...inputStyle,fontSize:13,padding:"10px 14px"}}/></div>
      {navItems.map(it=>(<button key={it.id} onClick={()=>{setPage(it.id);setMobileNav(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 20px",border:"none",cursor:"pointer",background:page===it.id?C.accentGlow:"transparent",color:page===it.id?C.accent:C.textMuted,fontSize:15,fontWeight:page===it.id?700:500}}><span style={{fontSize:20}}>{it.emoji}</span>{it.label}</button>))}
      <div style={{padding:"16px 20px",borderTop:`1px solid ${C.border}`,marginTop:12}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.accent}44,${C.purple}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:C.accent}}>{user.avatar}</div><div><p style={{fontSize:14,fontWeight:700}}>{user.nome}</p><p style={{fontSize:11,color:C.textDim}}>{user.role}</p></div><button onClick={()=>setUser(null)} style={{marginLeft:"auto",background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:16}}>⏻</button></div></div>
    </div>}

    {/* MAIN */}
    <div className="erp-main" style={{flex:1,padding:"28px 32px",overflowY:"auto",maxHeight:"100vh",paddingBottom:80}}>{renderPage()}</div>
    {modal?.type==="lancForm"&&<LancForm tipo={modal.tipo} onClose={()=>setModal(null)}/>}
    {modal?.type==="lancEdit"&&<LancForm tipo={modal.tipo} initial={modal.lanc} onClose={()=>setModal(null)}/>}
    {modal?.type==="obraForm"&&<ObraForm onClose={()=>setModal(null)}/>}
    {modal?.type==="obraEdit"&&<ObraForm initial={modal.obra} onClose={()=>setModal(null)}/>}
    {modal?.type==="cobForm"&&<CobForm onClose={()=>setModal(null)}/>}
    {modal?.type==="cobEdit"&&<CobForm initial={modal.cob} onClose={()=>setModal(null)}/>}
    {modal?.type==="staffForm"&&<StaffForm onClose={()=>setModal(null)}/>}
    {modal?.type==="staffEdit"&&<StaffForm initial={modal.staff} onClose={()=>setModal(null)}/>}
    {modal?.type==="opForm"&&<OpForm onClose={()=>setModal(null)}/>}
    {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:300,padding:"14px 24px",borderRadius:14,background:C.green,color:"#000",fontWeight:700,fontSize:13,animation:"slideUp 0.3s ease",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>{toast}</div>}
  </div>);
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
