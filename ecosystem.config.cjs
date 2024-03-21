module.exports = {
    apps : [{
        name: "compound-v2-liquidator", // Name of your application
        script: "packages/compound-v2-liquidator/main.ts", // Entry point of your application
        interpreter: "/Users/andrej/.bun/bin/bun", // Path to the Bun interpreter
        env: {
            "NODE_ENV": "development",
        },
        env_production : {
            "NODE_ENV": "production",
        }
    },
        // {
        //     name: "compound-v2-collector", // Name of your application
        //     script: "packages/compound-v2/src/collector-main.ts", // Entry point of your application
        //     interpreter: "/Users/andrej/.bun/bin/bun", // Path to the Bun interpreter
        //     env: {
        //         "NODE_ENV": "development",
        //     },
        //     env_production : {
        //         "NODE_ENV": "production",
        //     }
        // }
   ]
};
