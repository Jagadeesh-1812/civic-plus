import Nav from '@/components/ui/Nav';
import Footer from '@/components/ui/Footer';
import ReportForm from '@/components/report/ReportForm';

export default function ReportPage() {
  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Report a civic issue</h1>
          <p className="text-stone-600 mb-8">
            Upload a photo and we'll help categorize it. Takes under 30 seconds.
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 text-stone-900">
            <ReportForm />
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
