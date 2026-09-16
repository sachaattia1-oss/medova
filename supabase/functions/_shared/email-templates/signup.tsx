/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez votre adresse email pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}>
          <Text style={logo}>
            MED<span style={logoAccent}>OVA</span>
          </Text>
        </Section>
        <Heading style={h1}>Bienvenue sur MEDOVA 👋</Heading>
        <Text style={text}>
          Merci de votre inscription sur{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>{' '}
          ! Pour activer votre compte ({recipient}), confirmez votre adresse
          email en cliquant sur le bouton ci-dessous.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Confirmer mon email
          </Button>
        </Section>
        <Text style={smallText}>
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
          <br />
          <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
        </Text>
        <Text style={footer}>
          Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#133A66', margin: '0', letterSpacing: '0.5px' }
const logoAccent = { color: '#22A99B' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1D2733', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#1D2733', lineHeight: '1.6', margin: '0 0 20px' }
const smallText = { fontSize: '12px', color: '#6E7986', lineHeight: '1.5', margin: '0 0 25px', wordBreak: 'break-all' as const }
const link = { color: '#22A99B', textDecoration: 'underline' }
const button = {
  backgroundColor: '#133A66',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#6E7986', margin: '30px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }
