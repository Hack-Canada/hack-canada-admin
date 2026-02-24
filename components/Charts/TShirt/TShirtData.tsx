import { db } from "@/lib/db";
import { rsvp } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import TShirtPieChart from "./TShirtPieChart";

const TShirtData = async () => {
  const results = await db
    .select({
      tShirtSize: rsvp.tshirtSize,
      count: sql<number>`COUNT(${rsvp.userId})`,
    })
    .from(rsvp)
    .groupBy(rsvp.tshirtSize)
    .execute();

  return <TShirtPieChart data={results} />;
};
export default TShirtData;
