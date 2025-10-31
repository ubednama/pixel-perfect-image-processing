import DimensionTestRunner from '@/components/DimensionTestRunner';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Image Processing Tests</h1>
        <DimensionTestRunner />
      </div>
    </div>
  );
}