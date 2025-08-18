import { NextRequest, NextResponse } from "next/server";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs,
} from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase/client";
import { geohashQueryBounds, distanceBetween } from "geofire-common";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "50"); // km

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng are required" },
        { status: 400 }
      );
    }

    const db = getFirestore(getFirebaseApp());
    const usersRef = collection(db, "users");

    // radius in meters for geofire-common
    const radiusInM = radius * 1000;
    const bounds = geohashQueryBounds([lat, lng], radiusInM);

    // Run one query per geohash bound
    const promises = bounds.map((b) => {
      const q = query(usersRef, orderBy("geohash"), startAt(b[0]), endAt(b[1]));
      return getDocs(q);
    });

    const snapshots = await Promise.all(promises);

    const matchingDocs: any[] = [];

    snapshots.forEach((snap) => {
      snap.docs.forEach((doc) => {
        const data = doc.data() as any;
        if (!data.coordinates) return;

        const distanceInKm = distanceBetween(
          [lat, lng],
          [data.coordinates.latitude, data.coordinates.longitude]
        );

        if (distanceInKm <= radius) {
          matchingDocs.push({
            id: doc.id,
            ...data,
            distance: distanceInKm,
          });
        }
      });
    });

    // sort by closest → farthest
    matchingDocs.sort((a, b) => a.distance - b.distance);

    return NextResponse.json(matchingDocs);
  } catch (err: any) {
    console.error("Nearby API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
