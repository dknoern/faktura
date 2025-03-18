import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { customerModel } from "@/lib/models/customer";
import { Counter } from "@/lib/models/counter";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if(!body._id) {
      console.log("no customer number found, will generate new one");
      const newCustomerNumber = await Counter.findByIdAndUpdate({
        _id: 'customerNumber'
      }, {
        $inc: {
          seq: 1
        }
      });

      console.log("new customer number", newCustomerNumber.seq);
      body._id = newCustomerNumber.seq;

    }

    // Create a new customer
    const customer = await customerModel.create({
      ...body,
      lastUpdated: new Date(),
      search: `${body.firstName} ${body.lastName} ${body.company} ${body.email} ${body.phone}`.toLowerCase(),
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
} 