-- Verwijder de 2 meest recente dubbele forum topics over Willy Alberti en Johnny Jordaan
DELETE FROM forum_topics 
WHERE id IN (
  '6e856bb9-efd7-4358-9b00-3ce0592d3878',
  '02375519-5043-4077-a80a-6036b0645cab'
);