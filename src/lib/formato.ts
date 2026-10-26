const bs = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export const precioBs = (n: number) => `Bs ${bs.format(n)}`
