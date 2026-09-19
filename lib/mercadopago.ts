import { MercadoPagoConfig, OAuth, Order, Payment } from 'mercadopago'

// Client "da plataforma" — usado só pra operações de OAuth (trocar code por
// token do organizador). Toda operação de venda/split usa o access_token do
// organizador (ver getOrganizadorClient), não este.
export function getPlataformaClient() {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
}

export function getOrganizadorClient(accessToken: string) {
  return new MercadoPagoConfig({ accessToken })
}

export function getOAuth() {
  return new OAuth(getPlataformaClient())
}

export function getOrderClient(accessToken: string) {
  return new Order(getOrganizadorClient(accessToken))
}

export function getPaymentClient(accessToken: string) {
  return new Payment(getOrganizadorClient(accessToken))
}
