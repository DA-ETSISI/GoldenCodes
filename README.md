# 🟡 GoldenCodes – Plataforma de Votación de los Premios Goya ETSISI

**GoldenCodes** es la aplicación web oficial creada por la Delegación de Alumnos de la ETSISI para gestionar la votación interna de los Premios GoldenCodes.  
Su identidad visual se basa en un estilo limpio en **negro** y **amarillo**, evocando elegancia, contraste y claridad.

---

## 🎬 Descripción

GoldenCodes permite a estudiantes, profesores y PTGAS consultar las nominaciones y emitir votos de forma segura y verificable.  
El sistema está diseñado para ser rápido, claro y fácil de usar.

**Funciones clave**

- Visualización de categorías y nominaciones.
- Autenticación integrada.
- Voto único por usuario.
- Resultados actualizados.
- Interfaz responsiva con paleta negra y amarilla.

---

## 🚀 Tecnología

El backend utiliza **AdonisJS v6**, un framework para Node.js estructurado y tipado que facilita:

- Organización clara en controladores, modelos y servicios.
- Autenticación integrada.
- ORM robusto.
- Middlewares y validación incorporada.
- Desarrollo mantenible en TypeScript.

---

## ⚙️ Instalación

Debe existir una conexión a una base de datos sql

```bash
git clone https://github.com/ChavaDav/goldencodes.git
cd goldencodes
npm install
cp .env.example .env
node ace migration:run
node ace db:seed
npm run dev
```
