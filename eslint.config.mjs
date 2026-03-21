import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const config = [
	{
		ignores: [
			"Proyecto_Ejemplo/**",
			".next/**",
			"node_modules/**",
			"dist/**",
			"build/**",
		],
	},
	...nextVitals,
	...nextTs,
]

export default config
