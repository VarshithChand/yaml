export default function ProgressBar({

    visible

}){

    if(!visible)

        return null;

    return(

        <div className="progress">

            <div className="progress-bar"/>

        </div>

    );

}