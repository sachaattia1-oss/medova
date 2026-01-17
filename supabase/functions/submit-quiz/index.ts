import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserAnswer {
  questionId: string
  selectedAnswerIds: string[]
}

interface QuestionResult {
  questionId: string
  score: number
  errors: number
  correctAnswerIds: string[]
  selectedAnswerIds: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token for auth check
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { quizId, userAnswers, timeSpentSeconds } = await req.json() as {
      quizId: string
      userAnswers: UserAnswer[]
      timeSpentSeconds: number
    }

    if (!quizId || !userAnswers) {
      return new Response(
        JSON.stringify({ error: 'Données manquantes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${user.id} submitting quiz ${quizId}`)

    // Use service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch quiz questions
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', quizId)
      .order('order_index')

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      throw questionsError
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Quiz introuvable ou sans questions' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch correct answers for all questions (server-side only!)
    const questionIds = questions.map(q => q.id)
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('quiz_answers')
      .select('id, question_id, is_correct')
      .in('question_id', questionIds)

    if (answersError) {
      console.error('Error fetching answers:', answersError)
      throw answersError
    }

    // Calculate scores using medical scoring system
    const results: QuestionResult[] = []
    let totalScore = 0

    for (const question of questions) {
      const questionAnswers = answers?.filter(a => a.question_id === question.id) || []
      const correctAnswerIds = questionAnswers.filter(a => a.is_correct).map(a => a.id)
      const userAnswer = userAnswers.find(ua => ua.questionId === question.id)
      const selectedIds = userAnswer?.selectedAnswerIds || []

      // Calculate errors
      const missingCorrect = correctAnswerIds.filter(id => !selectedIds.includes(id)).length
      const extraIncorrect = selectedIds.filter(id => !correctAnswerIds.includes(id)).length
      const errors = missingCorrect + extraIncorrect

      // Medical scoring: 1pt (0 errors), 0.5pt (1 error), 0.2pt (2 errors), 0pt (>2 errors)
      let score = 0
      if (errors === 0) {
        score = 1
      } else if (errors === 1) {
        score = 0.5
      } else if (errors === 2) {
        score = 0.2
      }

      totalScore += score
      results.push({
        questionId: question.id,
        score,
        errors,
        correctAnswerIds,
        selectedAnswerIds: selectedIds,
      })
    }

    console.log(`Quiz ${quizId} - User ${user.id} - Score: ${totalScore}/${questions.length}`)

    // Save attempt using service role (bypasses RLS)
    const { data: attempt, error: insertError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        score: totalScore,
        total_questions: questions.length,
        time_spent_seconds: timeSpentSeconds,
        completed_at: new Date().toISOString(),
        answers_data: userAnswers,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving attempt:', insertError)
      throw insertError
    }

    // Return results with correct answers (only after submission!)
    return new Response(
      JSON.stringify({
        success: true,
        attemptId: attempt.id,
        totalScore,
        totalQuestions: questions.length,
        percentage: (totalScore / questions.length) * 100,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing quiz submission:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la validation du QCM' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})