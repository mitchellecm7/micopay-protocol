# MicoPay Protocol - Pending Implementation

## Estado Actual

El proyecto tiene los contratos Soroban funcionando (37 tests pasando), API x402 operativa, y demo en testnet. Lo que sigue es lo necesario para producción.

---

## 🔴 Prioridad 1: Red de Proveedores de Efectivo

### Por qué es crítico
Sin proveedores de efectivo, no hay producto. Es el activo más importante.

### Qué implementar

- [ ] **Sistema de registro de proveedores**
  - Onboarding: nombre, ubicación (GPS), teléfono, foto INE
  - Dashboard admin para aprobar/rechazar
  - UI: formulario web + validación

- [ ] **Sistema de matching geográfico**
  - Filtrar proveedores por radio (1km, 3km, 5km)
  - Ordenar por: distancia + reputation + fee
  - Integrar map provider (Mapbox/OpenStreetMap)

- [ ] **Incentivos para proveedores**
  - Fee por transacción (ej: 2-3%)
  - Historial de trades visible
  - Badges de reputación (Espora → Maestro)

### Contactos necesarios
- Tiendas de conveniencia (OXXO, Extra, etc.)
- Farmacias (Guadalajara, San Pablo)
- Centros comerciales
- Mercados locales

---

## 🟡 Prioridad 2: Persistencia y DB

### Por qué
Reemplazar datos hardcoded con datos reales.

### Qué implementar

- [ ] **PostgreSQL + Prisma/Drizzle**
  - Tablas: users, providers, trades, reputation, intents
  - Migraciones desde schema actual

- [ ] **Bazaar Intents**
  - Persistir intents en DB (no in-memory)
  - TTL para intents antiguos
  - Index por chain/origen/destino

- [ ] **Historial de Trades**
  - Tracking completo: created, completed, refunded, disputed
  - Métricas: volumen, tiempo promedio, success rate

---

## 🟡 Prioridad 3: Contrato NFT Soulbound (Reputación)

### Por qué
La reputación on-chain es clave para trust entre strangers.

### Qué implementar

- [ ] **Soroban NFT Contract**
  - No transferible (soulbound)
  - 4 niveles: Espora, Micelio, Hongo, Maestro
  - Mint only por admin (plataforma)

- [ ] **Lógica de upgrades**
  - Basado en trades completados
  - Automático via contrato o admin

- [ ] **Query endpoint**
  - `GET /api/v1/reputation/:address` → consulta NFT on-chain
  - Cache en DB para speed

---

## 🟠 Prioridad 4: Relayer Cross-Chain

### Por qué
Para atomic swaps reales ETH → MXN cash.

### Qué implementar

- [ ] **Watcher Service**
  - Listen a eventos de AtomicSwapHTLC en Stellar
  - Detectar `release()` → extraer preimage
  - Broadcast a otras chains

- [ ] **Adapter EVM**
  - Verificar Merkle proof en Ethereum
  - Ejecutar claim en bridge/native

- [ ] **Fallbacks**
  - Timeout handling
  - Reorg detection
  - Retry logic

**Nota**: Esto requiere inversión significativa en infraestructura.

---

## 🔵 Prioridad 5: Integraciones Production

### CETES (Etherfuse)
- [ ] API real de cotizaciones
- [ ] pathPaymentStrictReceive real
- [ ] Testnet → Mainnet

### Blend Protocol
- [ ] SDK integration real
- [ ] Health factor tracking
- [ ] Liquidación automática

### SPEI (Settlement)
- [ ] Integrar con banco/anchor mexicano
- [ ] Transferencia MXN a cuenta del proveedor
- [ ] KYC del proveedor

---

## 🟣 Prioridad 6: Compliance Legal

### Por qué
Para escalar sin problemas regulatorios.

### Qué implementar

- [ ] **KYC de proveedores**
  - Validación INE/RFC
  - selfie + video
  - PEP check

- [ ] **Límites de transacción**
  - Diario/semanal/mensual
  - AML thresholds

- [ ] **Entidad legal**
  - Persona moral para operar
  - Licencia de cambio o estructura compatible

- [ ] **Reporting**
  - Transacciones > $10k USD
  - SAR (Suspicious Activity Reports)

---

## 📋 Roadmap Sugerido

### Mes 1-2: Fundación
1. Onboarding de 20-50 proveedores locales (CDMX)
2. DB + persistence
3. MVP funcional: usuario → efectivo con 1 proveedor

### Mes 3-4: Escala
4. NFT reputación desplegado
5. 100+ proveedores
6. Optimizar fees y UX

### Mes 5-6: Expansión
7. SPEI integration
8. CETES/Blend reales
9. Otras ciudades (GDL, MTY)

### Mes 7-12: Multi-chain
10. Relayer cross-chain
11. ETH/BTC → MXN
12. DAO governance

---

## Recursos Existentes Reutilizables

| Componente | Estado | Reusar |
|-----------|--------|--------|
| MicopayEscrow (Rust) | ✅ Deployado | Sí |
| AtomicSwapHTLC (Rust) | ✅ Deployado | Sí |
| API x402 (Fastify) | ✅ Funcional | Sí |
| Frontend React | ✅ UI completa | Sí |
| Demo flow | ✅ Working | Sí |

---

## Contacto & Colaboración

Equipo actual: Eric + Stichui

---

*Última actualización: Abril 2026*