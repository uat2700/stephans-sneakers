import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyPaystackPayment } from "@/lib/paystack.functions";

export const Route = createFileRoute("/payment-callback")({
  head: () => ({
    meta: [
      { title: "Payment confirmation — Stephans Collection" },
      {
        name: "description",
        content:
          "Confirming your Paystack sneaker payment with Stephans Collection.",
      },
      {
        property: "og:title",
        content: "Payment confirmation — Stephans Collection",
      },
      {
        property: "og:description",
        content: "We are confirming your sneaker payment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const verify = useServerFn(verifyPaystackPayment);
  const [state, setState] = useState<"loading" | "paid" | "failed">("loading");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) {
      setState("failed");
      setMessage("Missing payment reference.");
      return;
    }
    verify({ data: { reference } })
      .then((result) => {
        setOrderNumber(result.order_number);
        setState(result.paid ? "paid" : "failed");
      })
      .catch((error: unknown) => {
        setState("failed");
        setMessage(
          error instanceof Error ? error.message : "Could not verify payment",
        );
      });
  }, [verify]);

  return (
    <div className="container-page max-w-lg py-20 text-center">
      {state === "loading" ? (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
          <h1 className="mt-6 font-display text-2xl font-extrabold uppercase tracking-tight">
            Confirming payment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hold on while we verify your transaction.
          </p>
        </>
      ) : state === "paid" ? (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-whatsapp" />
          <h1 className="mt-6 font-display text-2xl font-extrabold uppercase tracking-tight">
            Payment received
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {orderNumber
              ? `Order ${orderNumber} is confirmed. We'll be in touch about delivery.`
              : "Your order is confirmed."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link to="/account">View my orders</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/shop">Keep shopping</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-6 font-display text-2xl font-extrabold uppercase tracking-tight">
            Payment not completed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {message ?? "The payment was not successful. You can try again."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link to="/cart">Back to cart</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/account">My orders</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
