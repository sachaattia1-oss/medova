/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
}

const TutorSignupEmail = ({ name }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre demande de compte tuteur MEDOVA a bien été reçue</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}>
          <Text style={logo}>MED<span style={logoAccent}>OVA</span></Text>
        </Section>
        <Heading style={h1}>
          {name ? `Bonjour ${name},` : 'Bonjour,'}
        </Heading>
        <Text style={text}>
          Merci pour votre demande de compte tuteur sur <strong>MEDOVA</strong>.
        </Text>
        <Text style={text}>
          Votre demande est actuellement en cours d'examen par notre équipe d'administration.
          Vous recevrez un email dès que votre compte sera validé et que vous pourrez commencer
          à créer du contenu pour nos étudiants.
        </Text>
        <Text style={text}>
          Le délai de traitement est généralement de 24 à 48 heures ouvrées.
        </Text>
        <Text style={footer}>À très bientôt, l'équipe MEDOVA</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TutorSignupEmail,
  subject: 'Votre demande de compte tuteur MEDOVA',
  displayName: 'Tuteur — Demande reçue',
  previewData: { name: 'Marie' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#133A66', margin: '0', letterSpacing: '0.5px' }
const logoAccent = { color: '#22A99B' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1D2733', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#1D2733', lineHeight: '1.6', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: '#6E7986', margin: '30px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }
