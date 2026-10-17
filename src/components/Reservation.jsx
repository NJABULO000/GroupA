import { useState } from 'react'

function Field({ id, label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={id}
        required
        className="w-full rounded border border-muted bg-white p-3"
        {...props}
      />
    </div>
  )
}

function Reservation() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    event.currentTarget.reset()
    setSubmitted(true)
  }

  return (
    <section
      id="reservation"
      className="mx-auto max-w-[1100px] scroll-mt-16 border-t border-line px-5 py-16"
    >
      <h2 className="mb-2 font-heading text-3xl text-wine md:text-4xl">
        Reserve a table
      </h2>
      <p className="mb-6 text-muted">
        Tell us when you are coming and we will hold your table for 15 minutes.
      </p>

      <form
        onSubmit={handleSubmit}
        className="grid max-w-[640px] grid-cols-1 gap-4 md:grid-cols-2"
      >
        <Field id="name" label="Full name" type="text" />
        <Field id="email" label="Email" type="email" />
        <Field id="date" label="Date" type="date" />
        <Field id="time" label="Time" type="time" />
        <Field id="guests" label="Number of guests" type="number" min="1" max="12" defaultValue="2" />
        <button
          type="submit"
          className="justify-self-start rounded bg-wine px-6 py-3 font-semibold text-paper hover:brightness-125 md:col-span-2"
        >
          Reserve my table
        </button>
      </form>

      {submitted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/80 p-5"
        >
          <div className="w-full max-w-[420px] rounded-lg bg-paper p-8 text-center">
            <h2 id="confirmation-title" className="mb-2 font-heading text-2xl text-wine">
              Booking received
            </h2>
            <p className="mb-6">
              Thank you! We have received your reservation request and will
              confirm it by email shortly.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded bg-wine px-6 py-3 font-semibold text-paper hover:brightness-125"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Reservation