import { useLocation } from 'react-router-dom';
import PageContainer from '../components/common/PageContainer';
import MatchesList from '../components/matches/MatchesList';

export default function Matches() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full w-full bg-velora-gray" style={{ height: '100%', width: '100%' }}>
      <PageContainer className="bg-velora-gray" fullWidth={true} padding={false}>
        <div style={{ marginTop: 0, paddingTop: '1rem', paddingLeft: 0, paddingRight: 0 }}>
          <MatchesList key={location.pathname} />
        </div>
      </PageContainer>
    </div>
  );
}

