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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Vous êtes invité(e) à rejoindre {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}>
          <Text style={logo}>MED<span style={logoAccent}>OVA</span></Text>
        </Section>
        <Heading style={h1}>Vous êtes invité(e)</Heading>
        <Text style={text}>
          Vous avez été invité(e) à rejoindre{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer
          votre compte.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Accepter l'invitation
          </Button>
        </Section>
        <Text style={footer}>
          Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#133A66', margin: '0', letterSpacing: '0.5px' }
const logoAccent = { color: '#22A99B' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1D2733', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#1D2733', lineHeight: '1.6', margin: '0 0 20px' }
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
