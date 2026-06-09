/**
 * GraphQL type definitions for Order & Cart Service.
 *
 * Definisi ini diekspor sebagai plain string agar tim GraphQL Gateway
 * dapat mengimpor dan menggabungkannya ke federated schema.
 *
 * Usage in Gateway:
 *   const { typeDefs } = require('order-service/src/graphql/typeDefs');
 */

const typeDefs = `
  enum OrderStatus {
    pending
    confirmed
    preparing
    ready
    completed
    cancelled
  }

  enum PaymentStatus {
    unpaid
    paid
    refunded
  }

  type CartItem {
    id: Int!
    menu_id: String!
    merchant_id: String!
    quantity: Int!
    price: Float!
    notes: String
  }

  type Cart {
    id: Int!
    user_id: Int!
    items: [CartItem!]!
  }

  type OrderItem {
    id: Int!
    menu_id: String!
    menu_name: String!
    quantity: Int!
    price: Float!
    notes: String
  }

  type Order {
    id: Int!
    user_id: Int!
    merchant_id: String!
    status: OrderStatus!
    total_amount: Float!
    payment_status: PaymentStatus!
    notes: String
    items: [OrderItem!]!
    created_at: String!
    updated_at: String!
  }

  type CheckoutResult {
    orders: [Order!]!
    message: String!
  }

  type MessagePayload {
    message: String!
  }

  input AddCartItemInput {
    menu_id: String!
    merchant_id: String!
    quantity: Int!
    price: Float
    notes: String
  }

  input UpdateCartItemInput {
    quantity: Int!
  }

  type Query {
    cart: Cart
    orders: [Order!]!
    order(id: Int!): Order
    merchantOrders(merchant_id: String!): [Order!]!
  }

  type Mutation {
    addCartItem(input: AddCartItemInput!): Cart!
    updateCartItem(item_id: Int!, input: UpdateCartItemInput!): Cart!
    removeCartItem(item_id: Int!): Cart!
    clearCart: MessagePayload!
    checkout(notes: String): CheckoutResult!
    updateOrderStatus(order_id: Int!, status: OrderStatus!): Order!
  }
`;

module.exports = { typeDefs };
