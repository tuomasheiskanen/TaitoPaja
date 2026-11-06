import ReadingModule from './modules/reading/ReadingModule';

// One module for now. New skills (e.g. math) go under src/modules/ and get a menu here.
export default function App() {
  return (
    <div className="app">
      <div className="moon" />
      <ReadingModule />
    </div>
  );
}
