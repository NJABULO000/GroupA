function MenuCard({ item }) {
  return (
    <article className="flex flex-col overflow-hidden rounded border border-line bg-white">
      <img
        src={item.image}
        alt={item.name}
        width="600"
        height="400"
        loading="lazy"
        className="aspect-[3/2] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex justify-between gap-4 font-semibold">
          <h3 className="font-heading text-lg">{item.name}</h3>
          <span>R{item.price}</span>
        </div>
        <p className="text-muted">{item.description}</p>
      </div>
    </article>
  )
}

export default MenuCard