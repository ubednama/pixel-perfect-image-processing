import DimensionTestRunner from "@/components/DimensionTestRunner";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-center text-3xl font-bold">
          Image Processing Tests
        </h1>
        <DimensionTestRunner />
      </div>
    </div>
  );
}
