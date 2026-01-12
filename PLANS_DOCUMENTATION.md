# Sistema de Planos - Documentação para IA

## Conceito
Planos são pacotes de assinatura compostos por múltiplas Features. Cada feature no plano tem um preço específico. O valor total do plano = soma dos preços das features no plano.

## Estrutura de Dados

```typescript
interface Plan {
  id: number;
  name: string;                    // Obrigatório
  description?: string;            // Opcional
  isActive: boolean;               // Status ativo/inativo
  features: PlanFeature[];         // Array de features (mínimo 1)
  createdAt?: string;
  updatedAt?: string;
}

interface PlanFeature {
  featureId: number;               // ID da feature (obrigatório)
  featureName?: string;            // Nome da feature (vem do backend)
  price: number;                   // Preço desta feature no plano (obrigatório, min: 0)
}
```

**Importante**: O `price` em `PlanFeature` é independente do preço base da feature. Permite precificação customizada por plano.

## API Service (`plansService.ts`)

**Endpoint**: `/api/admin/plans`

**Métodos**:
- `getAll(params?)` → `PaginatedResponse<Plan>` - Lista com paginação, busca (`q`), filtro `isActive`
- `getById(id)` → `Plan`
- `create(data: CreatePlanData)` → `Plan`
- `update(id, data: UpdatePlanData)` → `Plan`
- `delete(id)` → `void`

**Payload de Criação/Atualização**:
```typescript
{
  name: string;                    // Obrigatório
  description?: string;
  isActive?: boolean;              // Padrão: true
  features: [                      // Obrigatório, mínimo 1
    { featureId: number, price: number },
    ...
  ]
}
```

## Validações (`plans.schema.ts`)

- **Nome**: obrigatório, mínimo 1 caractere
- **Features**: array obrigatório, mínimo 1 item
- **Cada feature**: `featureId` (número, min: 1), `price` (número, min: 0)

## Páginas

### PlansList (`/plans`)
- Lista paginada (20 itens/página)
- Busca por nome/descrição
- Exibe: nome, descrição, quantidade de features, **valor total** (soma dos preços), status, ações
- Cálculo: `features.reduce((sum, f) => sum + f.price, 0)`
- Formatação: `R$ X.XXX,XX` (BRL)

### PlanForm (`/plans/new`, `/plans/:id/edit`)
**Campos**:
- Nome (texto, obrigatório)
- Descrição (texto, opcional)
- Status ativo (checkbox)

**Features (array dinâmico)**:
- Botão "Adicionar Feature" → adiciona novo campo
- Cada campo tem:
  - Select de feature (busca features ativas via `featuresService.getAll()`)
  - Input de preço em R$ (`MoneyInput` com máscara: prefixo "R$ ", separador decimal ",", milhar ".")
  - Botão remover
- **Valor total** calculado em tempo real e exibido abaixo da lista

**Validação**: Mínimo 1 feature obrigatória, cada feature com preço válido

**Fluxo de dados**:
- **Edição**: `plan.features.map(f => ({ featureId: f.featureId, price: f.price }))`
- **Submit**: Envia array de `{ featureId, price }` para API

## Relacionamentos

- **Depende de Features**: Busca features ativas para popular o select
- **Preço independente**: O preço da feature no plano não usa o preço base da feature

## Rotas

```typescript
/plans              → PlansList
/plans/new          → PlanForm (criar)
/plans/:id/edit     → PlanForm (editar)
```

## Componentes Utilizados

- `FormInput`: Campos de texto
- `Select`: Dropdown de features
- `MoneyInput`: Input monetário formatado (R$)
- `Checkbox`: Status ativo
- `useFieldArray` (react-hook-form): Gerenciar array dinâmico de features
- `ConfirmDialog`: Confirmação de exclusão

## Observações Importantes

1. **Moeda**: Sistema usa R$ (BRL) para planos, mesmo que features tenham múltiplas moedas
2. **Features ativas**: Apenas `isActive: true` aparecem no select
3. **Valor total**: Sempre calculado pela soma dos preços no plano, não pelos preços base
4. **Validação mínima**: Plano precisa de pelo menos 1 feature

## Exemplo de Payload

```json
{
  "name": "Plano Premium",
  "description": "Plano completo",
  "isActive": true,
  "features": [
    { "featureId": 1, "price": 99.90 },
    { "featureId": 2, "price": 149.90 }
  ]
}
```
