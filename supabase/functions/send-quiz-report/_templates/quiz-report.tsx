import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface QuestionResult {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizReportEmailProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  quizType: string;
  badge: string;
  badgeEmoji: string;
  questions: QuestionResult[];
  pointsEarned: number;
  shareUrl?: string;
}

export const QuizReportEmail = ({
  score,
  totalQuestions,
  percentage,
  quizType,
  badge,
  badgeEmoji,
  questions,
  pointsEarned,
  shareUrl,
}: QuizReportEmailProps) => (
  <Html>
    <Head />
    <Preview>🎵 Je MusicScan Quiz Rapport - {percentage}% Score!</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={headerEmoji}>{badgeEmoji}</Text>
          <Heading style={headerTitle}>Quiz Rapport</Heading>
          <Text style={headerSubtitle}>MusicScan {quizType} Quiz</Text>
        </Section>

        {/* Score Card */}
        <Section style={scoreCard}>
          <Row>
            <Column style={scoreColumn}>
              <Text style={scoreValue}>{percentage}%</Text>
              <Text style={scoreLabel}>Score</Text>
            </Column>
            <Column style={scoreColumn}>
              <Text style={scoreValue}>{score}/{totalQuestions}</Text>
              <Text style={scoreLabel}>Correct</Text>
            </Column>
            <Column style={scoreColumn}>
              <Text style={scoreValueGreen}>+{pointsEarned}</Text>
              <Text style={scoreLabel}>Punten</Text>
            </Column>
          </Row>
        </Section>

        {/* Badge */}
        <Section style={badgeSection}>
          <Text style={badgeDisplay}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>{badgeEmoji}</span>
            {badge}
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Questions Review */}
        <Section style={reviewSection}>
          <Heading as="h2" style={reviewTitle}>Antwoorden Overzicht</Heading>
          
          {questions.map((q, i) => (
            <Section key={i} style={questionItem}>
              <Text style={questionText}>
                {i + 1}. {q.question}
              </Text>
              <Text style={q.isCorrect ? answerCorrect : answerIncorrect}>
                {q.isCorrect 
                  ? `✓ Correct: ${q.correctAnswer}` 
                  : `✗ Jouw antwoord: ${q.userAnswer} • Correct: ${q.correctAnswer}`
                }
              </Text>
            </Section>
          ))}
        </Section>

        {/* Share Button */}
        {shareUrl && (
          <Section style={shareSection}>
            <Link href={shareUrl} style={shareButton}>
              Bekijk & Deel je Score
            </Link>
          </Section>
        )}

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>Dit rapport is verzonden door MusicScan</Text>
          <Link href="https://www.musicscan.app/quizzen" style={footerLink}>
            Speel meer quizzen op musicscan.app
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default QuizReportEmail

// Styles
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
}

const header = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '32px',
  textAlign: 'center' as const,
}

const headerEmoji = {
  fontSize: '48px',
  margin: '0 0 8px 0',
}

const headerTitle = {
  color: 'white',
  margin: '0 0 8px 0',
  fontSize: '28px',
  fontWeight: 'bold',
}

const headerSubtitle = {
  color: 'rgba(255,255,255,0.9)',
  margin: '0',
  fontSize: '16px',
}

const scoreCard = {
  backgroundColor: 'white',
  padding: '24px',
}

const scoreColumn = {
  textAlign: 'center' as const,
  width: '33.33%',
}

const scoreValue = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#7c3aed',
  margin: '0',
}

const scoreValueGreen = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#22c55e',
  margin: '0',
}

const scoreLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '4px 0 0 0',
}

const badgeSection = {
  backgroundColor: 'white',
  padding: '20px',
  textAlign: 'center' as const,
}

const badgeDisplay = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
  padding: '12px 24px',
  borderRadius: '99px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0',
}

const divider = {
  borderColor: '#eee',
  margin: '0',
}

const reviewSection = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '0 0 16px 16px',
}

const reviewTitle = {
  margin: '0 0 16px 0',
  fontSize: '18px',
  fontWeight: '600',
}

const questionItem = {
  padding: '12px 0',
  borderBottom: '1px solid #eee',
}

const questionText = {
  fontWeight: '500',
  margin: '0 0 4px 0',
  fontSize: '14px',
}

const answerCorrect = {
  fontSize: '13px',
  color: '#22c55e',
  margin: '0',
}

const answerIncorrect = {
  fontSize: '13px',
  color: '#ef4444',
  margin: '0',
}

const shareSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
}

const shareButton = {
  display: 'inline-block',
  backgroundColor: '#7c3aed',
  color: 'white',
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '500',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
}

const footerText = {
  color: '#666',
  fontSize: '13px',
  margin: '0 0 8px 0',
}

const footerLink = {
  color: '#7c3aed',
  fontSize: '13px',
}
