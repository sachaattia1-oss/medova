/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification MEDOVA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}>
          <Text style={logo}>MED<span style={logoAccent}>OVA</span></Text>
        </Section>
        <Heading style={h1}>Confirmer votre identité</Heading>
        <Text style={text}>Utilisez le code ci-dessous pour confirmer votre identité :</Text>
        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          Ce code expirera dans quelques minutes. Si vous n'êtes pas à
          l'origine de cette demande, ignorez cet email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#133A66', margin: '0', letterSpacing: '0.5px' }
const logoAccent = { color: '#22A99B' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1D2733', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#1D2733', lineHeight: '1.6', margin: '0 0 20px', textAlign: 'center' as const }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#133A66',
  letterSpacing: '6px',
  backgroundColor: '#f1f5f9',
  padding: '16px 24px',
  borderRadius: '12px',
  display: 'inline-block',
  margin: '0',
}
const footer = { fontSize: '12px', color: '#6E7986', margin: '30px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' as const }
