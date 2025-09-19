-- Create table for storing quiz results
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL DEFAULT 'collection_knowledge',
  questions_total INTEGER NOT NULL,
  questions_correct INTEGER NOT NULL,
  score_percentage NUMERIC NOT NULL,
  time_taken_seconds INTEGER,
  quiz_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own quiz results" 
ON public.quiz_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz results" 
ON public.quiz_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz results" 
ON public.quiz_results 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz results" 
ON public.quiz_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX idx_quiz_results_created_at ON public.quiz_results(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_quiz_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_quiz_results_updated_at
BEFORE UPDATE ON public.quiz_results
FOR EACH ROW
EXECUTE FUNCTION public.update_quiz_results_updated_at();