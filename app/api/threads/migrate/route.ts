import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dataService } from "@/lib/data-service";

export async function POST(request: NextRequest) {
  try {
    console.log("Migration API endpoint called");

    // Get the current session to verify the user is authenticated
    const session = await auth.api.getSession(request);

    if (!session?.user) {
      console.error("Migration failed: User not authenticated");
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to migrate data" },
        { status: 401 }
      );
    }

    console.log("User authenticated, proceeding with migration", {
      userId: session.user.id,
    });

    // Call the migration function from the data service
    const success = await dataService.migrateLocalDataToSupabase();

    if (success) {
      console.log("Migration completed successfully");
      return NextResponse.json(
        { message: "Data migration completed successfully" },
        { status: 200 }
      );
    } else {
      console.error("Migration failed in data service");
      return NextResponse.json(
        { error: "Data migration failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error migrating data:", errorMessage);
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
