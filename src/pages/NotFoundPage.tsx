import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { SectionHeading } from '../components/SectionHeading';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return <Container className="py-section text-center">
    <SectionHeading as="h1" marathi="हे पान सापडले नाही" description="The page you are looking for is not available." />
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Button asChild><Link to="/">Back to home</Link></Button>
      <Button asChild variant="outline"><Link to="/faral">Shop Faral</Link></Button>
    </div>
  </Container>;
}
