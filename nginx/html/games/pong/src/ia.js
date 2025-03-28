const NB_INDIVIDU = 50
const SELECTION_RATE = 0.5



function generate_pop(pop)
{
    for (let i = 0; i < NB_INDIVIDU; i++)
    {
        pop.push({ indiv

        })
        for (let j = 0; j < )
    }
}

export function ft_ia(pop, ball, paddle, tour)
{
    if (tour == 1)
        generate_pop(pop)
    else
        maj_pop(pop)

    let elapsedtime = Date.now()
    while (Date.now() - elapsedtime < 100)
    {
        ft_simulate()
        ft_selection()
    }


}