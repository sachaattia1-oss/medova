/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  dashboardUrl?: string
}

const TutorApprovedEmail = ({ name, dashboardUrl = 'https://medova-med.fr/tutor' }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre compte tuteur MEDOVA a été activé !</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}>
          <Text style={logo}>MED<span style={logoAccent}>OVA</span></Text>
        </Section>
        <Heading style={h1}>
          {name ? `Félicitations ${name} !` : 'Félicitations !'}
        </Heading>
        <Text style={text}>
          Votre compte tuteur sur <strong>MEDOVA</strong> vient d'être validé par notre équipe.
        </Text>
        <Text style={text}>
          Vous pouvez désormais accéder à votre espace tuteur pour :
        </Text>
        <Text style={text}>
          • Créer et publier des cours<br />
          • Concevoir des séries de QCM<br />
          • Répondre aux questions des étudiants<br />
          • Suivre vos rémunérations
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button style={button} href={dashboardUrl}>
            Accéder à mon espace tuteur
          </Button>
        </Section>
        <Text style={text}>
          Bienvenue dans l'équipe MEDOVA, et merci de contribuer à la réussite de nos étudiants !
        </Text>
        <Text style={footer}>À très bientôt, l'équipe MEDOVA</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TutorApprovedEmail,
  subject: '🎉 Votre compte tuteur MEDOVA est activé',
  displayName: 'Tuteur — Compte approuvé',
  previewData: { name: 'Marie', dashboardUrl: 'https://medova-med.fr/tutor' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#133A66', margin: '0', letterSpacing: '0.5px' }
const logoAccent = { color: '#22A99B' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1D2733', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#1D2733', lineHeight: '1.6', margin: '0 0 20px' }
const button = {
  backgroundColor: '#22A99B',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#6E7986', margin: '30px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }
