export const Header = ({ showSearch = true }: { showSearch?: boolean }) => {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <span className="text-lg font-semibold">MusicScan</span>
    </header>
  );
};
